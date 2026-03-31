import { ParticipantManager } from '@/components/ParticipantManager';
import { ExpenseForm } from '@/components/ExpenseForm';
import { ExpenseList } from '@/components/ExpenseList';
import { DebtSummary } from '@/components/DebtSummary';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <ParticipantManager />
          <ExpenseForm />
        </div>
        {/* Right column */}
        <div className="space-y-6">
          <DebtSummary />
          <ExpenseList />
        </div>
      </div>
    </div>
  );
}
