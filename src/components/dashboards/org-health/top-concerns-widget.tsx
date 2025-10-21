"use client"

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

const topConcerns = [
    { theme: "Work-Life Balance", mentions: 45, sentiment: "Negative" },
    { theme: "Communication Clarity", mentions: 32, sentiment: "Negative" },
    { theme: "Career Growth Opportunities", mentions: 28, sentiment: "Mixed" },
    { theme: "Recognition", mentions: 15, sentiment: "Positive" },
];

export default function TopConcernsWidget() {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    <AlertCircle className="text-primary" />
                    Top Themes & Concerns
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {topConcerns.map(item => (
                        <div key={item.theme} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                            <p className="text-sm font-medium">{item.theme}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">{item.mentions}</span>
                                <Badge 
                                    variant={item.sentiment === "Negative" ? "destructive" : item.sentiment === "Positive" ? "success" : "secondary"}
                                >
                                    {item.sentiment}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}