import { PageLayout } from "@/components/PageLayout";
import ConfigGenerator from "@/components/ConfigGenerator";

const ConfigGeneratorPage = () => {
  return (
    <PageLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Configuration Generator</h1>
        <div className="grid grid-cols-1 gap-6">
          <ConfigGenerator />
        </div>
      </div>
    </PageLayout>
  );
};

export default ConfigGeneratorPage; 