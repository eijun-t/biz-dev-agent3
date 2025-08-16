import { SimpleJobForm } from '@/components/simple-job-form';

export default function OrchestrationPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">オーケストレーション</h1>
      <p className="text-gray-600 mb-8">5つのAIエージェントが協調して動作します</p>
      <SimpleJobForm />
    </div>
  );
}