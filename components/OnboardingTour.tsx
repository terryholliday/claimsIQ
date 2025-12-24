import React, { useEffect, useState, useRef } from 'react';
import { XMarkIcon, ArrowRightIcon } from './icons/Icons';

export interface TourStep {
    targetId: string;
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
    steps: TourStep[];
    isOpen: boolean;
    onComplete: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ steps, isOpen, onComplete }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    const currentStep = steps[currentStepIndex];

    const updatePosition = () => {
        const element = document.getElementById(currentStep.targetId);
        if (element) {
            const rect = element.getBoundingClientRect();
            setTargetRect(rect);
            
            // Tooltip dimensions (approximate max size)
            const tooltipWidth = 320;
            const tooltipHeight = 220; 
            const gap = 16;

            let top = 0;
            let left = 0;

            // Default to bottom if not specified
            const pos = currentStep.position || 'bottom';

            switch (pos) {
                case 'right':
                    left = rect.right + gap;
                    top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
                    break;
                case 'left':
                    left = rect.left - tooltipWidth - gap;
                    top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
                    break;
                case 'top':
                    top = rect.top - tooltipHeight - gap;
                    left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
                    break;
                case 'bottom':
                default:
                    top = rect.bottom + gap;
                    left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
                    break;
            }

            // --- Viewport Boundary Clamping ---
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const padding = 20; // Keep tooltip away from edges

            // Clamp horizontal
            if (left < padding) left = padding;
            if (left + tooltipWidth > viewportWidth - padding) {
                left = viewportWidth - tooltipWidth - padding;
            }

            // Clamp vertical
            if (top < padding) top = padding;
            if (top + tooltipHeight > viewportHeight - padding) {
                // Adjust logic to keep it on screen if possible
                top = viewportHeight - tooltipHeight - padding;
            }

            setPosition({ top, left });
            
            // Only scroll if element is significantly off screen
            if (rect.top < 0 || rect.bottom > viewportHeight) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            setTargetRect(null); // Reset if not found to avoid ghost overlay
        }
    };

    useEffect(() => {
        if (isOpen) {
            // Small delay to ensure DOM is rendered if switching screens
            setTimeout(updatePosition, 300);
            window.addEventListener('resize', updatePosition);
            return () => window.removeEventListener('resize', updatePosition);
        }
    }, [isOpen, currentStepIndex, currentStep]);

    if (!isOpen || !currentStep) return null;

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
            {/* Overlay and Highlight - Only show if target exists */}
            {targetRect && (
                <>
                    {/* 1. The Shadow Overlay (Static - No Pulse) */}
                    <div 
                        className="absolute rounded-lg transition-all duration-500 ease-in-out shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
                        style={{
                            top: targetRect.top - 4,
                            left: targetRect.left - 4,
                            width: targetRect.width + 8,
                            height: targetRect.height + 8,
                        }}
                    />
                    
                    {/* 2. The Border Ring (Animated - Pulses) */}
                    <div 
                        className="absolute rounded-lg transition-all duration-500 ease-in-out border-2 border-brand-accent animate-pulse"
                        style={{
                            top: targetRect.top - 4,
                            left: targetRect.left - 4,
                            width: targetRect.width + 8,
                            height: targetRect.height + 8,
                        }}
                    />

                    {/* Tooltip Card - Render only if we have a target */}
                    <div 
                        className="absolute pointer-events-auto bg-white rounded-xl shadow-2xl p-6 w-80 animate-in fade-in zoom-in-95 duration-300 border border-gray-100"
                        style={{
                            top: position.top,
                            left: position.left,
                        }}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                                Step {currentStepIndex + 1} of {steps.length}
                            </span>
                            <button onClick={handleSkip} className="text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        </div>
                        
                        <h3 className="text-lg font-bold text-neutral-dark mb-2">{currentStep.title}</h3>
                        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                            {currentStep.content}
                        </p>

                        <div className="flex justify-between items-center">
                            <button 
                                onClick={handleSkip} 
                                className="text-sm text-gray-500 hover:text-gray-800 font-medium"
                            >
                                Skip Tour
                            </button>
                            <button 
                                onClick={handleNext}
                                className="bg-brand-primary hover:bg-brand-secondary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                            >
                                {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}
                                <ArrowRightIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default OnboardingTour;