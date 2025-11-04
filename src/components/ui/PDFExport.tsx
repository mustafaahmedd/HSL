'use client';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IRegistration } from '@/types/Registration';

interface PDFExportProps {
    registrations: IRegistration[];
    eventTitle: string;
    filters?: {
        iconPlayer?: string;
        courseType?: string;
        year?: string;
        timings?: string;
        status?: string;
        paymentStatus?: string;
        category?: string;
    };
}

export const exportToPDF = (registrations: IRegistration[], eventTitle: string, filters?: PDFExportProps['filters']) => {
    const doc = new jsPDF('landscape', 'mm', 'a4');

    // Title
    doc.setFontSize(18);
    doc.text(eventTitle, 14, 15);

    // Filters info
    let filtersText = 'Filters: ';
    const activeFilters: string[] = [];
    if (filters?.iconPlayer && filters.iconPlayer !== 'all') {
        activeFilters.push(`Icon Player: ${filters.iconPlayer}`);
    }
    if (filters?.courseType && filters.courseType !== 'all') {
        activeFilters.push(`Course Type: ${filters.courseType === 'darse_nizami' ? 'Darse Nizami' : 'Courses'}`);
    }
    if (filters?.year && filters.year !== 'all') {
        activeFilters.push(`Year: ${filters.year}`);
    }
    if (filters?.timings && filters.timings !== 'all') {
        activeFilters.push(`Timings: ${filters.timings}`);
    }
    if (filters?.status && filters.status !== 'all') {
        activeFilters.push(`Status: ${filters.status}`);
    }
    if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
        activeFilters.push(`Payment: ${filters.paymentStatus}`);
    }
    if (filters?.category && filters.category !== 'all') {
        activeFilters.push(`Category: ${filters.category}`);
    }

    filtersText += activeFilters.length > 0 ? activeFilters.join(', ') : 'All';

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(filtersText, 14, 22);

    // Date
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 27);

    // Prepare table data
    const tableData = registrations.map((reg, index) => [
        (index + 1).toString(),
        reg.name || '-',
        reg.contactNo || '-',
        reg.courseEnrolled || '-',
        reg.darseNizamiYear || reg.currentCourseYear || '-',
        reg.timings || '-',
        reg.approvedCategory || reg.selfAssignedCategory || '-',
        reg.approvedSkillLevel || reg.skillLevel || '-',
        reg.status || '-',
        reg.paymentStatus === 'paid' || reg.isPaid ? 'Paid' : 'Pending',
        `PKR ${reg.amountPaid || 0}`,
    ]);

    // Table columns
    autoTable(doc, {
        startY: 32,
        head: [[
            '#',
            'Name',
            'Contact',
            'Course',
            'Year',
            'Timings',
            'Category',
            'Skill',
            'Status',
            'Payment',
            'Amount'
        ]],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [59, 130, 246], // Blue
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9,
        },
        bodyStyles: {
            fontSize: 8,
            textColor: [0, 0, 0],
        },
        alternateRowStyles: {
            fillColor: [245, 247, 250],
        },
        styles: {
            cellPadding: 2,
            overflow: 'linebreak',
            cellWidth: 'wrap',
        },
        columnStyles: {
            0: { cellWidth: 10 }, // #
            1: { cellWidth: 30 }, // Name
            2: { cellWidth: 25 }, // Contact
            3: { cellWidth: 25 }, // Course
            4: { cellWidth: 15 }, // Year
            5: { cellWidth: 20 }, // Timings
            6: { cellWidth: 20 }, // Category
            7: { cellWidth: 15 }, // Skill
            8: { cellWidth: 20 }, // Status
            9: { cellWidth: 20 }, // Payment
            10: { cellWidth: 20 }, // Amount
        },
    });

    // Save PDF
    const fileName = `${eventTitle.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};

export default exportToPDF;

