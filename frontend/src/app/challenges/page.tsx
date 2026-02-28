"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { ChallengeCard } from "@/components/challenges/ChallengeCard";
import { CreateChallengeModal } from "@/components/challenges/CreateChallengeModal";
import { Button } from "@/components/ui/Button";
import challengesData from "@/mocks/challenges.json";

interface ChallengeItem {
  id: string;
  name: string;
  goal: number;
  unit: string;
  endDate: string;
  participants: number;
  joined?: boolean;
  progress?: number;
  streak?: number;
  description?: string;
}

export default function ChallengesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { list } = challengesData as { list: ChallengeItem[] };
  const [challenges, setChallenges] = useState(list);

  const handleJoin = (id: string) => {
    setChallenges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, joined: true, progress: 0 } : c))
    );
  };

  return (
    <PageShell>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Challenges</h1>
            <p className="text-slate-600">Save with friends and earn badges</p>
          </div>
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create challenge
          </Button>
        </div>

        <div className="space-y-4">
          {challenges.map((ch) => (
            <div key={ch.id} className="flex items-center gap-4">
              <div className="flex-1">
                <ChallengeCard
                  id={ch.id}
                  name={ch.name}
                  goal={ch.goal}
                  unit={ch.unit}
                  endDate={ch.endDate}
                  participants={ch.participants}
                  joined={ch.joined}
                  progress={ch.progress}
                  description={ch.description}
                  onJoin={handleJoin}
                />
              </div>
              <Link href={`/challenges/${ch.id}`}>
                <Button variant="outline" size="sm">View</Button>
              </Link>
            </div>
          ))}
        </div>

        <CreateChallengeModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={() => setModalOpen(false)}
        />
      </div>
    </PageShell>
  );
}
