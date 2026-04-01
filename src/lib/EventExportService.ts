import type { Event } from './types';
import { generateId } from './generateId';

export interface ExportData {
  version: number;
  event: Event;
}

export class EventExportService {
  export(event: Event): void {
    const exportData: ExportData = { version: 1, event };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async import(file: File): Promise<Event> {
    const text = await file.text();
    const data = JSON.parse(text);
    if (
      !data ||
      !data.event ||
      !data.event.name ||
      !Array.isArray(data.event.participants) ||
      !Array.isArray(data.event.expenses)
    ) {
      throw new Error('Invalid file format');
    }
    return {
      ...data.event,
      id: generateId(),
      name: data.event.name,
    };
  }
}
