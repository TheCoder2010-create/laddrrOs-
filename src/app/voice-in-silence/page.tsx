
"use client";

import { useRole } from '@/hooks/use-role';
import RoleSelection from '@/components/role-selection';
import DashboardLayout from '@/components/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function VoiceInSilencePage() {
  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold font-headline mb-2 text-foreground">
            🕊️ Voice – In Silence
          </CardTitle>
          <p className="text-muted-foreground italic text-lg">
            “Because speaking up should never feel unsafe.”
          </p>
        </CardHeader>
        <CardContent className="space-y-6 text-base">
          <div>
            <h2 className="text-xl font-semibold mb-2">🔍 What is this?</h2>
            <p className="text-muted-foreground">
              Voice – In Silence is a protected space designed for those who want to raise a concern, flag an issue, or share sensitive feedback — without being identified.
            </p>
            <p className="text-muted-foreground mt-2">
              You don’t need to log in. You don’t need to reveal who you are. You don’t even need to say your name.
            </p>
            <p className="text-muted-foreground mt-2">
              Whether you're reporting misconduct, unfair treatment, a policy violation, or something that just doesn’t feel right — this space exists for you to speak safely and securely.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">🔐 Why is this outside the login system?</h2>
            <p className="text-muted-foreground">
              To protect your identity, Voice – In Silence is intentionally kept outside your account. When you're ready to submit a concern, the system ensures that:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
              <li>You are fully logged out</li>
              <li>No personal data or session info is attached</li>
              <li>You may choose to remain anonymous or use a pseudonym</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              We’ve designed this separation not just for privacy — but for your peace of mind.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">🔒 How your submission is protected:</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Stored as a tamper-evident, cryptographically hashed record</li>
              <li>Routed only to the appropriate compliance or HR reviewers</li>
              <li>You receive a tracking token to follow up anonymously later</li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">🚪 How to begin?</h2>
            <p className="text-muted-foreground">
              Logout, and then look for Voice – In Silence on the top header of the screen. That will take you to a private submission page — no login required.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">🙌 You are not alone.</h2>
            <p className="text-muted-foreground">
              Silence isn’t always consent — sometimes, it’s fear. Voice – In Silence gives you a safe, protected channel to speak your truth.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


export default function Home() {
  const { role, setRole, isLoading } = useRole();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-32 w-full mt-8" />
        </div>
      </div>
    );
  }

  if (!role) {
    return <RoleSelection onSelectRole={setRole} />;
  }

  return (
    <DashboardLayout role={role} onSwitchRole={setRole}>
        <VoiceInSilencePage />
    </DashboardLayout>
  );
}
