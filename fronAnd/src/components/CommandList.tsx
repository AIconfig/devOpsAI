
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import CodeBlock from '@/components/CodeBlock';
import { Badge } from '@/components/ui/badge';

interface Command {
  command: string;
  description: string;
  usage: string;
  category: string;
}

interface CommandListProps {
  commands: Command[];
  filtered?: boolean;
  selectedCategory?: string;
}

const CommandList: React.FC<CommandListProps> = ({ commands, filtered = false, selectedCategory = null }) => {
  if (commands.length === 0 && filtered) {
    return (
      <div className="text-center py-8 border rounded-md">
        <p className="text-muted-foreground">No commands match your search criteria.</p>
      </div>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Command</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="hidden md:table-cell">Usage</TableHead>
              {!selectedCategory && <TableHead className="hidden lg:table-cell">Category</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {commands.map((cmd, index) => (
              <TableRow key={index}>
                <TableCell className="font-mono whitespace-nowrap">{cmd.command}</TableCell>
                <TableCell>{cmd.description}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <CodeBlock code={cmd.usage} title="" minified />
                </TableCell>
                {!selectedCategory && (
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant="outline">{cmd.category}</Badge>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default CommandList;
