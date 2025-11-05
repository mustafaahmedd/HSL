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

    // Helper function to parse skill level to number for sorting
    const parseSkillLevel = (skillLevel: string | undefined): number => {
        if (!skillLevel) return 0;
        // Extract number from skill level string (e.g., "4 Stars" -> 4)
        const match = skillLevel.toString().match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    };

    const sortedRegistrations = [...registrations].sort((a, b) => {
        // Helper function to get sort priority
        const getPriority = (reg: IRegistration): number => {
            // Priority 1: Icon Players
            if (reg.approvedIconPlayer === true) {
                return 1;
            }

            // Priority 2-4: By category
            const category = reg.approvedCategory || reg.selfAssignedCategory || '';
            const categoryLower = category.toLowerCase();

            if (categoryLower === 'platinum') return 2;
            if (categoryLower === 'diamond') return 3;
            if (categoryLower === 'gold') return 4;

            // Priority 5: Others
            return 5;
        };

        const priorityA = getPriority(a);
        const priorityB = getPriority(b);

        // If priorities are different, sort by priority
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        // Secondary sort: Skill Level (descending - 4 stars first, then 3, 2, 1)
        const skillA = parseSkillLevel(a.approvedSkillLevel || a.skillLevel);
        const skillB = parseSkillLevel(b.approvedSkillLevel || b.skillLevel);
        if (skillA !== skillB) {
            return skillB - skillA; // Descending order
        }

        // Tertiary sort: Alphabetical by name
        return (a.name || '').localeCompare(b.name || '');
    });

    const getCategoryColor = (category: string): number[] => {
        const categoryLower = category.toLowerCase();
        if (categoryLower === 'platinum') {
            return [230, 230, 230]; // Light gray/silver
        } else if (categoryLower === 'diamond') {
            return [173, 216, 230]; // Light blue
        } else if (categoryLower === 'gold') {
            return [255, 248, 220]; // Light yellow/gold
        }
        return [255, 255, 255]; // White/default
    };

    // Prepare table data
    const tableData = sortedRegistrations.map((reg, index) => {
        // Add "Captain" prefix to category if approvedIconPlayer is true
        let category = reg.approvedCategory || reg.selfAssignedCategory || '-';
        if (reg.approvedIconPlayer === true) {
            category = `Captain ${category}`;
        }

        // Merge Role/Style with Skill Level
        const skillLevel = reg.approvedSkillLevel || reg.skillLevel || '';
        const roleStyleAndSkill = [
            reg.playerRole,
            reg.playingStyle,
            skillLevel // Add skill level at the end
        ]
            .filter(Boolean)
            .join('\n') || '-';

        return [
            (index + 1).toString(),
            reg.name || '-',
            reg.contactNo || '-',
            [
                reg.courseEnrolled,
                reg.darseNizamiYear || reg.currentCourseYear,
                reg.timings
            ]
                .filter(Boolean)
                .join('\n') || '-',
            category,
            roleStyleAndSkill,
        ];
    });

    // Table columns
    autoTable(doc, {
        startY: 32,
        head: [[
            '#',
            'Name',
            'Contact',
            'Course',
            'Category',
            'Role/Style',
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
            1: { cellWidth: 38 }, // Name
            2: { cellWidth: 32 }, // Contact
            3: { cellWidth: 45 }, // Course (merged Course, Year, Timings)
            4: { cellWidth: 28 }, // Category
            5: { cellWidth: 55 }, // Role/Style (merged with Skill)
        },
        didParseCell: (data: any) => {
            // For Category column, set white background so badge can be drawn on top
            if (data.column.index === 4 && data.section === 'body') {
                data.cell.styles.fillColor = [255, 255, 255]; // White background
            }
        },
        willDrawCell: (data: any) => {
            // Draw badge-style background for Category column (index 4)
            if (data.column.index === 4 && data.section === 'body' && data.row.index !== undefined) {
                const rowIndex = data.row.index;
                if (sortedRegistrations[rowIndex]) {
                    const categoryText = data.cell.text[0] || '';
                    // Remove "Captain " prefix to get actual category for color
                    const actualCategory = categoryText.replace(/^Captain\s+/i, '');
                    const bgColor = getCategoryColor(actualCategory);

                    // Get text dimensions
                    doc.setFontSize(data.cell.styles.fontSize);
                    const textWidth = doc.getTextWidth(categoryText);
                    const textHeight = data.cell.styles.fontSize * 0.8;

                    // Badge padding
                    const paddingX = 2;
                    const paddingY = 1;
                    const badgeWidth = textWidth + (paddingX * 2);
                    const badgeHeight = textHeight + (paddingY * 2);

                    // Center the badge within the cell
                    const badgeX = data.cell.x + (data.cell.width - badgeWidth) / 2;
                    const badgeY = data.cell.y + (data.cell.height - badgeHeight) / 2;

                    // Draw rounded rectangle (badge) background
                    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
                    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, 'F');
                }
            }
        },
    });

    // Save PDF
    const fileName = `${eventTitle.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};

export default exportToPDF;