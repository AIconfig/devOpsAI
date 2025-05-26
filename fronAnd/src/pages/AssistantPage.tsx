
import React from 'react';
import CheatsheetLayout from '@/components/CheatsheetLayout';
import AiChat from '@/components/AiChat';
import { useTranslation } from '@/lib/useTranslation';

const AssistantPage = () => {
  const { t } = useTranslation();

  return (
    <CheatsheetLayout>
      <div className="container mx-auto max-w-4xl h-[calc(100vh-10rem)]">
        <h1 className="text-3xl font-bold mb-6">{t.navigation.aiAssistant}</h1>
        <div className="h-[calc(100%-4rem)]">
          <AiChat />
        </div>
      </div>
    </CheatsheetLayout>
  );
};

export default AssistantPage;
