import { GenerativeDesign } from '../components/GenerativeDesign';

interface GenerativeLabProps {
    isCritical: boolean;
    onLog?: (message: string) => void;
}

export function GenerativeLab({ isCritical, onLog }: GenerativeLabProps) {
    return (
        <div className="h-full min-h-[400px]">
            <GenerativeDesign isCritical={isCritical} onLog={onLog} />
        </div>
    );
}

export default GenerativeLab;
