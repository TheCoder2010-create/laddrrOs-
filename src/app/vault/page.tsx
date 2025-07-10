
'use server';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getAllFeedback } from '@/services/feedback-service';
import { formatDistanceToNow } from 'date-fns';

export default async function VaultPage() {
  const allFeedback = await getAllFeedback();

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline mb-2 text-foreground">
            🔒 Feedback Vault
          </CardTitle>
           <CardDescription className="text-lg text-muted-foreground italic">
            Confidential submissions from Voice – in Silence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allFeedback.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">The vault is currently empty.</p>
              <p className="text-sm text-muted-foreground mt-2">
                New anonymous submissions will appear here.
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {allFeedback.map((feedback) => (
                <AccordionItem value={feedback.trackingId} key={feedback.trackingId}>
                  <AccordionTrigger>
                    <div className="flex justify-between w-full pr-4">
                      <span className="font-medium">{feedback.subject}</span>
                      <span className="text-sm text-muted-foreground font-normal">
                        {formatDistanceToNow(feedback.submittedAt, { addSuffix: true })}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <p className="whitespace-pre-wrap text-base text-muted-foreground">{feedback.message}</p>
                    <div className="text-xs text-muted-foreground/80">
                      Tracking ID: <code className="font-mono">{feedback.trackingId}</code>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
