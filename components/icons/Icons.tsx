import React from 'react';

const createIcon = (name: string) => (props: React.SVGProps<SVGSVGElement>) => (
    <svg title={name} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

export const Icon = createIcon('Icon'); // Base icon (mocked)

// Navigation & Layout
export const DashboardIcon = createIcon('DashboardIcon');
export const MenuIcon = createIcon('MenuIcon');
export const UserIcon = createIcon('UserIcon');
export const HomeIcon = createIcon('HomeIcon');
export const FolderIcon = createIcon('FolderIcon');
export const QueueListIcon = createIcon('QueueListIcon');
export const TableCellsIcon = createIcon('TableCellsIcon');
export const ArrowLeftIcon = createIcon('ArrowLeftIcon');
export const XMarkIcon = createIcon('XMarkIcon');
export const PlusIcon = createIcon('PlusIcon');
export const MinusIcon = createIcon('MinusIcon');
export const ChevronDownIcon = createIcon('ChevronDownIcon');
export const ChevronRightIcon = createIcon('ChevronRightIcon');

// Actions & Status
export const CheckCircleIcon = createIcon('CheckCircleIcon');
export const CheckIcon = createIcon('CheckIcon');
export const CheckBadgeIcon = createIcon('CheckBadgeIcon');
export const XCircleIcon = createIcon('XCircleIcon');
export const ExclamationTriangleIcon = createIcon('ExclamationTriangleIcon');
export const InformationCircleIcon = createIcon('InformationCircleIcon');
export const QuestionMarkCircleIcon = createIcon('QuestionMarkCircleIcon');
export const ShieldCheckIcon = createIcon('ShieldCheckIcon');
export const ShieldExclamationIcon = createIcon('ShieldExclamationIcon');
export const FlagIcon = createIcon('FlagIcon');
export const TrashIcon = createIcon('TrashIcon');
export const PencilSquareIcon = createIcon('PencilSquareIcon');
export const ArrowPathIcon = createIcon('ArrowPathIcon');
export const ArrowRightIcon = createIcon('ArrowRightIcon');
export const MagnifyingGlassIcon = createIcon('MagnifyingGlassIcon');
export const FunnelIcon = createIcon('FunnelIcon');
export const PlayIcon = createIcon('PlayIcon');
export const PaperAirplaneIcon = createIcon('PaperAirplaneIcon');
export const ShareIcon = createIcon('ShareIcon');
export const PrinterIcon = createIcon('PrinterIcon');
export const LockClosedIcon = createIcon('LockClosedIcon');

// Data Types & Objects
export const DocumentTextIcon = createIcon('DocumentTextIcon');
export const DocumentIcon = createIcon('DocumentIcon');
export const DocumentDuplicateIcon = createIcon('DocumentDuplicateIcon');
export const PaperClipIcon = createIcon('PaperClipIcon');
export const CalendarIcon = createIcon('CalendarIcon');
export const ClockIcon = createIcon('ClockIcon');
export const CameraIcon = createIcon('CameraIcon');
export const VideoCameraIcon = createIcon('VideoCameraIcon');
export const VideoCameraSlashIcon = createIcon('VideoCameraSlashIcon');
export const MicrophoneIcon = createIcon('MicrophoneIcon');
export const MapPinIcon = createIcon('MapPinIcon');
export const MapIcon = createIcon('MapIcon');
export const TagIcon = createIcon('TagIcon');
export const QrCodeIcon = createIcon('QrCodeIcon');
export const FingerPrintIcon = createIcon('FingerPrintIcon');
export const BoltIcon = createIcon('BoltIcon');
export const HeartIcon = createIcon('HeartIcon');
export const ListBulletIcon = createIcon('ListBulletIcon');
export const ChatBubbleLeftRightIcon = createIcon('ChatBubbleLeftRightIcon');
export const ChatBubbleBottomCenterTextIcon = createIcon('ChatBubbleBottomCenterTextIcon');

// Analysis & Specific Concepts
export const SparklesIcon = createIcon('SparklesIcon');
export const CurrencyDollarIcon = createIcon('CurrencyDollarIcon');
export const BanknotesIcon = createIcon('BanknotesIcon');
export const ScaleIcon = createIcon('ScaleIcon');
export const CalculatorIcon = createIcon('CalculatorIcon');
export const ReceiptPercentIcon = createIcon('ReceiptPercentIcon');
export const ArrowTrendingDownIcon = createIcon('ArrowTrendingDownIcon');
export const DocumentMagnifyingGlassIcon = createIcon('DocumentMagnifyingGlassIcon');
export const CloudArrowUpIcon = createIcon('CloudArrowUpIcon');
export const CloudArrowDownIcon = createIcon('CloudArrowDownIcon');
export const CloudIcon = createIcon('CloudIcon');
export const CpuChipIcon = createIcon('CpuChipIcon');
export const CubeTransparentIcon = createIcon('CubeTransparentIcon');
export const BuildingLibraryIcon = createIcon('BuildingLibraryIcon');
export const BuildingStorefrontIcon = createIcon('BuildingStorefrontIcon');
export const MegaphoneIcon = createIcon('MegaphoneIcon');
export const StarIcon = createIcon('StarIcon');
export const TrophyIcon = createIcon('TrophyIcon');
export const AcademicCapIcon = createIcon('AcademicCapIcon');
export const LightBulbIcon = createIcon('LightBulbIcon');
export const CodeBracketIcon = createIcon('CodeBracketIcon');
export const BellIcon = createIcon('BellIcon');
export const ChartBarIcon = createIcon('ChartBarIcon');
export const UserCircleIcon = createIcon('UserCircleIcon');
export const UserGroupIcon = createIcon('UserGroupIcon');
export const ServerStackIcon = createIcon('ServerStackIcon');
export const EnvelopeIcon = createIcon('EnvelopeIcon');
export const DevicePhoneMobileIcon = createIcon('DevicePhoneMobileIcon');
export const WrenchScrewdriverIcon = createIcon('WrenchScrewdriverIcon');
export const ArrowDownTrayIcon = createIcon('ArrowDownTrayIcon');
export const BookOpenIcon = createIcon('BookOpenIcon');

// New Additions
export const MobilePhoneIcon = createIcon('MobilePhoneIcon');
export const ShoppingBagIcon = createIcon('ShoppingBagIcon');
export const TruckIcon = createIcon('TruckIcon');
