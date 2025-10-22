"use client";

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Flame } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const heatmapData = [
    { department: "Engineering", sentimentScore: 68, risk: "Medium" },
    { department: "Sales", sentimentScore: 55, risk: "High" },
    { department: "Marketing", sentimentScore: 82, risk: "Low" },
    { department: "Support", sentimentScore: 75, risk: "Low" },
    { department: "Product", sentimentScore: 62, risk: "Medium" },
    { department: "HR", sentimentScore: 88, risk: "Low" },
];

const getRiskColor = (risk: string) => {
    switch (risk) {
        case "High": return "bg-red-500/80 hover:bg-red-500";
        case "Medium": return "bg-yellow-500/80 hover:bg-yellow-500";
        case "Low": return "bg-green-500/80 hover:bg-green-500";
        default: return "bg-gray-400";
    }
};

export default function RiskHeatmapWidget() {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Flame className="text-destructive" />
                    Department Risk Heatmap
                </CardTitle>
            </CardHeader>
            <CardContent>
                <TooltipProvider>
                    <div className="grid grid-cols-3 gap-2">
                        {heatmapData.map(item => (
                             <Tooltip key={item.department}>
                                <TooltipTrigger asChild>
                                    <div className={cn(
                                        "p-2 rounded-md text-center text-white transition-colors cursor-pointer",
                                        getRiskColor(item.risk)
                                    )}>
                                        <p className="font-bold text-sm truncate">{item.department}</p>
                                        <p className="text-xs opacity-90">{item.risk}</p>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Department: {item.department}</p>
                                    <p>Risk Level: {item.risk}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </div>
                </TooltipProvider>
            </CardContent>
        </Card>
    );
}
