import { EventExportService } from '../../src/lib/EventExportService';
import type { Event } from '../../src/lib/types';

const mockEvent: Event = {
  id: 'evt-1',
  name: 'Test Trip',
  createdAt: 1000,
  participants: [{ id: 'u1', name: 'Alice' }],
  expenses: [],
};

function makeFile(content: string): File {
  const file = new Blob([content]) as File;
  // jsdom Blob has text(), but File may not — ensure it exists
  if (!file.text) {
    (file as { text: () => Promise<string> }).text = () => Promise.resolve(content);
  }
  return file;
}

describe('EventExportService', () => {
  let service: EventExportService;

  beforeEach(() => {
    service = new EventExportService();
    // Polyfill URL methods for jsdom
    if (!URL.createObjectURL) {
      URL.createObjectURL = jest.fn(() => 'blob:test');
    }
    if (!URL.revokeObjectURL) {
      URL.revokeObjectURL = jest.fn();
    }
  });

  describe('export', () => {
    it('creates a downloadable JSON blob', () => {
      const clickSpy = jest.fn();
      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue({
        set href(_: string) {},
        set download(_: string) {},
        click: clickSpy,
      } as unknown as HTMLAnchorElement);

      service.export(mockEvent);

      expect(clickSpy).toHaveBeenCalled();
      createElementSpy.mockRestore();
    });
  });

  describe('import', () => {
    it('parses valid export file and returns event with new ID', async () => {
      const data = JSON.stringify({ version: 1, event: mockEvent });
      const file = makeFile(data);

      const result = await service.import(file);

      expect(result.name).toBe('Test Trip');
      expect(result.participants).toHaveLength(1);
      expect(result.id).not.toBe('evt-1'); // should get new ID
    });

    it('rejects invalid file format', async () => {
      const file = makeFile('{}');
      await expect(service.import(file)).rejects.toThrow('Invalid file format');
    });

    it('rejects file with missing participants', async () => {
      const data = JSON.stringify({ version: 1, event: { name: 'X' } });
      const file = makeFile(data);
      await expect(service.import(file)).rejects.toThrow('Invalid file format');
    });

    it('rejects non-JSON content', async () => {
      const file = makeFile('not json');
      await expect(service.import(file)).rejects.toThrow();
    });
  });
});
