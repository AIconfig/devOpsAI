
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  sectionTitle: z.string().min(1, "Section title is required"),
  configTitle: z.string().min(1, "Config title is required"),
  configCode: z.string().min(1, "Code snippet is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddConfigFormProps {
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
}

const AddConfigForm: React.FC<AddConfigFormProps> = ({ onSubmit, onCancel }) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sectionTitle: '',
      configTitle: '',
      configCode: '',
      notes: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="sectionTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Section Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Basic Commands" {...field} />
                </FormControl>
                <FormDescription>
                  The name of the section this config belongs to
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="configTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Config Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. SSH Configuration" {...field} />
                </FormControl>
                <FormDescription>
                  A title for this specific configuration
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="configCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code Snippet</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="# Your code or configuration here" 
                  className="font-mono h-60"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                The code, command or configuration snippet
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional notes or explanation for this configuration" 
                  className="h-20"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Any additional documentation or explanation for this configuration
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Save Configuration
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddConfigForm;
