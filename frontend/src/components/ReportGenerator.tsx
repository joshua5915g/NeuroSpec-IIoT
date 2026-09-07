import { useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FileDown } from 'lucide-react';

interface ReportGeneratorProps {
    isCritical: boolean;
    currentMetric: { amp: number; score: number };
    rpm: number;
}

export function ReportGenerator({ isCritical, currentMetric, rpm }: ReportGeneratorProps) {

    const generateReport = async () => {
        try {
            // Capture the main content area (excluding sidebar)
            const mainContent = document.querySelector('main');
            if (!mainContent) {
                console.error('Main content not found');
                return;
            }

            // Show loading indicator
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 border border-cyan-500 rounded-lg p-6 z-[9999]';
            loadingDiv.innerHTML = '<div class="text-cyan-400 font-mono text-sm">GENERATING REPORT...</div>';
            document.body.appendChild(loadingDiv);

            // Capture screenshot
            const canvas = await html2canvas(mainContent as HTMLElement, {
                backgroundColor: '#050508',
                scale: 2,
                logging: false,
            });

            // Remove loading indicator
            document.body.removeChild(loadingDiv);

            // Create PDF
            const pdf = new jsPDF('landscape', 'mm', 'a4');
            const imgWidth = 297; // A4 landscape width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Add header
            pdf.setFillColor(15, 23, 42); // slate-900
            pdf.rect(0, 0, 297, 25, 'F');
            pdf.setTextColor(16, 185, 129); // emerald-500
            pdf.setFontSize(18);
            pdf.setFont('helvetica', 'bold');
            pdf.text('NEUROSPEC IIoT - INCIDENT REPORT', 148.5, 12, { align: 'center' });

            // Add timestamp and status
            const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
            pdf.setFontSize(10);
            pdf.setTextColor(148, 163, 184); // slate-400
            pdf.text(`Generated: ${timestamp}`, 148.5, 19, { align: 'center' });

            // Add status badge
            pdf.setFontSize(12);
            if (isCritical) {
                pdf.setTextColor(239, 68, 68); // red-500
                pdf.text('STATUS: CRITICAL FAILURE', 10, 10);
            } else {
                pdf.setTextColor(16, 185, 129); // emerald-500
                pdf.text('STATUS: SYSTEM OPTIMAL', 10, 10);
            }

            // Add metrics summary
            pdf.setFontSize(9);
            pdf.setTextColor(148, 163, 184);
            const metricsText = `RPM: ${rpm} | Amplitude: ${currentMetric.amp.toFixed(3)} | Anomaly Score: ${currentMetric.score.toFixed(4)}`;
            pdf.text(metricsText, 10, 20);

            // Add screenshot
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            let yPosition = 30;

            // Check if image needs to be on a new page
            if (imgHeight > 180) {
                pdf.addPage();
                yPosition = 10;
            }

            pdf.addImage(imgData, 'JPEG', 5, yPosition, imgWidth - 10, Math.min(imgHeight, 180));

            // Add footer on every page
            const pageCount = pdf.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                pdf.setFillColor(15, 23, 42);
                pdf.rect(0, 200, 297, 10, 'F');
                pdf.setFontSize(8);
                pdf.setTextColor(100, 116, 139); // slate-500
                pdf.text('CONFIDENTIAL // SYSTEM ID: V-909', 148.5, 206, { align: 'center' });
                pdf.text(`Page ${i} of ${pageCount}`, 280, 206, { align: 'right' });
            }

            // Download PDF
            const filename = `incident_log_${Date.now()}.pdf`;
            pdf.save(filename);

            // Show success message
            const successDiv = document.createElement('div');
            successDiv.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-emerald-900 border border-emerald-500 rounded-lg px-6 py-3 z-[9999] animate-in fade-in';
            successDiv.innerHTML = '<div class="text-emerald-200 font-mono text-sm">✓ REPORT DOWNLOADED</div>';
            document.body.appendChild(successDiv);
            setTimeout(() => document.body.removeChild(successDiv), 3000);

        } catch (error) {
            console.error('Error generating report:', error);
            alert('Failed to generate report. Please try again.');
        }
    };

    // Listen for auto-trigger event
    useEffect(() => {
        const handleAutoGenerate = () => {
            generateReport();
        };

        window.addEventListener('generateReport', handleAutoGenerate);
        return () => window.removeEventListener('generateReport', handleAutoGenerate);
    }, [isCritical, currentMetric, rpm]);

    return (
        <button
            onClick={generateReport}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-900/30 hover:bg-cyan-900/50 border border-cyan-500/50 rounded-lg text-cyan-400 font-bold text-xs tracking-wider transition-all"
        >
            <FileDown className="w-4 h-4" />
            DOWNLOAD REPORT
        </button>
    );
}

export default ReportGenerator;
