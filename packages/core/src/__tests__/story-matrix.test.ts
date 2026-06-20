import { describe, it, expect, beforeEach } from 'vitest';
import {
  FIXED_SLOTS,
  WEEK_THEMES,
  generateStoryTasks,
  type Restaurant,
} from '../story-matrix';

describe('Story Matrix Engine', () => {
  describe('FIXED_SLOTS', () => {
    it('should have exactly 9 slots from 15h to 23h', () => {
      expect(FIXED_SLOTS).toHaveLength(9);
      expect(FIXED_SLOTS[0].hour).toBe(15);
      expect(FIXED_SLOTS[8].hour).toBe(23);
    });

    it('should have slot names in correct order', () => {
      expect(FIXED_SLOTS[0].name).toBe('Movimento');
      expect(FIXED_SLOTS[1].name).toBe('História');
      expect(FIXED_SLOTS[2].name).toBe('Preparação');
      expect(FIXED_SLOTS[3].name).toBe('Aberto');
      expect(FIXED_SLOTS[4].name).toBe('Primeiros pedidos');
      expect(FIXED_SLOTS[5].name).toBe('Produção');
      expect(FIXED_SLOTS[6].name).toBe('Prova social');
      expect(FIXED_SLOTS[7].name).toBe('Escassez');
      expect(FIXED_SLOTS[8].name).toBe('Encerramento');
    });
  });

  describe('WEEK_THEMES', () => {
    it('should have exactly 4 weeks', () => {
      expect(WEEK_THEMES).toHaveLength(4);
      expect(WEEK_THEMES[0].week).toBe(1);
      expect(WEEK_THEMES[1].week).toBe(2);
      expect(WEEK_THEMES[2].week).toBe(3);
      expect(WEEK_THEMES[3].week).toBe(4);
    });

    it('should have 7 daily themes for each week', () => {
      for (const weekTheme of WEEK_THEMES) {
        expect(Object.keys(weekTheme.daily_themes)).toHaveLength(7);
        for (let day = 0; day <= 6; day++) {
          expect(weekTheme.daily_themes[day]).toBeDefined();
          expect(weekTheme.daily_themes[day]).toBeTruthy();
        }
      }
    });

    it('should have week names', () => {
      expect(WEEK_THEMES[0].name).toBe('Operação por dia');
      expect(WEEK_THEMES[1].name).toBe('Pessoas');
      expect(WEEK_THEMES[2].name).toBe('Autoridade');
      expect(WEEK_THEMES[3].name).toBe('Conversão');
    });
  });

  describe('generateStoryTasks', () => {
    let restaurant: Restaurant;

    beforeEach(() => {
      restaurant = {
        id: 'restaurant-1',
        tenant_id: 'tenant-1',
        name: 'Test Restaurant',
        slug: 'test-restaurant',
        open_hour: 15,
        close_hour: 23,
        timezone: 'Africa/Maputo',
      };
    });

    it('should generate tasks for all 9 slots when restaurant is open 15-23', () => {
      const tasks = generateStoryTasks(restaurant, new Date('2024-01-01T00:00:00Z'), 1);
      expect(tasks.length).toBe(9); // 9 slots
    });

    it('should generate tasks only within operating hours', () => {
      restaurant.open_hour = 16;
      restaurant.close_hour = 22;
      const tasks = generateStoryTasks(restaurant, new Date('2024-01-01T00:00:00Z'), 1);
      expect(tasks.length).toBe(6); // 16, 17, 18, 19, 20, 21 (22 is exclusive)
    });

    it('should generate tasks with correct structure', () => {
      const tasks = generateStoryTasks(restaurant, new Date('2024-01-01T00:00:00Z'), 1);
      const task = tasks[0];

      expect(task).toHaveProperty('tenant_id');
      expect(task).toHaveProperty('restaurant_id');
      expect(task).toHaveProperty('scheduled_for');
      expect(task).toHaveProperty('week_of_month');
      expect(task).toHaveProperty('weekday');
      expect(task).toHaveProperty('hour');
      expect(task).toHaveProperty('theme');
      expect(task).toHaveProperty('title');
      expect(task).toHaveProperty('instructions');

      expect(task.tenant_id).toBe('tenant-1');
      expect(task.restaurant_id).toBe('restaurant-1');
      expect(task.week_of_month).toBeGreaterThanOrEqual(1);
      expect(task.week_of_month).toBeLessThanOrEqual(4);
      expect(task.weekday).toBeGreaterThanOrEqual(0);
      expect(task.weekday).toBeLessThanOrEqual(6);
      expect(task.hour).toBeGreaterThanOrEqual(15);
      expect(task.hour).toBeLessThanOrEqual(23);
    });

    it('should calculate scheduled_for correctly for Africa/Maputo timezone', () => {
      // Africa/Maputo is UTC+2
      // 15:00 local = 13:00 UTC
      const tasks = generateStoryTasks(restaurant, new Date('2024-01-01T00:00:00Z'), 1);
      const task15h = tasks.find((t) => t.hour === 15);

      expect(task15h).toBeDefined();
      expect(task15h!.scheduled_for).toContain('T13:00:00'); // 15:00 local = 13:00 UTC
    });

    it('should use different themes for different weeks', () => {
      // January 1, 2024 is week 1
      const week1Tasks = generateStoryTasks(restaurant, new Date('2024-01-01T00:00:00Z'), 1);
      
      // January 8, 2024 is week 2
      const week2Tasks = generateStoryTasks(restaurant, new Date('2024-01-08T00:00:00Z'), 1);

      expect(week1Tasks.length).toBeGreaterThan(0);
      expect(week2Tasks.length).toBeGreaterThan(0);

      // Get themes from same weekday (Monday = 1)
      const week1MondayTheme = week1Tasks.find((t) => t.weekday === 1)?.theme;
      const week2MondayTheme = week2Tasks.find((t) => t.weekday === 1)?.theme;

      expect(week1MondayTheme).toBeDefined();
      expect(week2MondayTheme).toBeDefined();
      expect(week1MondayTheme).not.toBe(week2MondayTheme); // Week 1 ≠ Week 2
    });

    it('should not repeat theme within the same month', () => {
      // Generate tasks for 7 days (week 1)
      const week1Tasks = generateStoryTasks(restaurant, new Date('2024-01-01T00:00:00Z'), 7);
      
      // Generate tasks for 7 more days (week 2)
      const week2Tasks = generateStoryTasks(restaurant, new Date('2024-01-08T00:00:00Z'), 7);

      // Get unique themes from week 1
      const week1Themes = new Set(week1Tasks.map((t) => t.theme));
      const week2Themes = new Set(week2Tasks.map((t) => t.theme));

      // Each week should have 7 different themes (one per day)
      expect(week1Themes.size).toBe(7);
      expect(week2Themes.size).toBe(7);

      // Week 1 and Week 2 should have completely different themes
      const intersection = [...week1Themes].filter((theme) => week2Themes.has(theme));
      expect(intersection.length).toBe(0);
    });

    it('should generate correct week_of_month for each day', () => {
      // Generate tasks for 7 days
      const tasks = generateStoryTasks(restaurant, new Date('2024-01-01T00:00:00Z'), 7);

      // January 1-7 should all be week 1
      const week1Days = tasks.filter((t) => t.week_of_month === 1);
      expect(week1Days.length).toBe(7 * 9); // 7 days * 9 slots

      // Generate tasks for January 8-14
      const week2Tasks = generateStoryTasks(restaurant, new Date('2024-01-08T00:00:00Z'), 7);

      // January 8-14 should all be week 2
      const week2Days = week2Tasks.filter((t) => t.week_of_month === 2);
      expect(week2Days.length).toBe(7 * 9);
    });

    it('should generate correct weekday for each day', () => {
      // January 1, 2024 is Monday (weekday 1)
      const tasks = generateStoryTasks(restaurant, new Date('2024-01-01T00:00:00Z'), 1);

      // All tasks should have weekday 1 (Monday)
      tasks.forEach((task) => {
        expect(task.weekday).toBe(1);
      });
    });

    it('should generate tasks for multiple days', () => {
      const tasks = generateStoryTasks(restaurant, new Date('2024-01-01T00:00:00Z'), 3);
      
      // 3 days * 9 slots = 27 tasks
      expect(tasks.length).toBe(27);

      // Should have tasks for 3 different weekdays
      const weekdays = new Set(tasks.map((t) => t.weekday));
      expect(weekdays.size).toBe(3);
    });

    it('should handle different timezones correctly', () => {
      restaurant.timezone = 'America/New_York'; // UTC-5
      const tasks = generateStoryTasks(restaurant, new Date('2024-01-01T00:00:00Z'), 1);

      expect(tasks.length).toBe(9);
      
      // 15:00 local in America/New_York = 20:00 UTC
      const task15h = tasks.find((t) => t.hour === 15);
      expect(task15h).toBeDefined();
      expect(task15h!.scheduled_for).toContain('T20:00:00');
    });
  });

  describe('Matrix Coverage', () => {
    it('should cover 9 slots × 7 days × 4 weeks without repeating theme', () => {
      const restaurant: Restaurant = {
        id: 'restaurant-1',
        tenant_id: 'tenant-1',
        name: 'Test Restaurant',
        slug: 'test-restaurant',
        open_hour: 15,
        close_hour: 23,
        timezone: 'Africa/Maputo',
      };

      // Generate tasks for 28 days (full month)
      const allTasks = generateStoryTasks(restaurant, new Date('2024-01-01T00:00:00Z'), 28);

      // Should have 28 days * 9 slots = 252 tasks
      expect(allTasks.length).toBe(252);

      // Verify all 9 slots are covered each day
      for (let day = 0; day < 28; day++) {
        const dayTasks = allTasks.filter((t) => {
          const taskDate = new Date(t.scheduled_for);
          const expectedDate = new Date('2024-01-01T00:00:00Z');
          expectedDate.setDate(expectedDate.getDate() + day);
          return taskDate.toDateString() === expectedDate.toDateString();
        });

        expect(dayTasks.length).toBe(9); // 9 slots per day

        // Verify all 9 different hours
        const hours = dayTasks.map((t) => t.hour);
        expect(hours.sort()).toEqual([15, 16, 17, 18, 19, 20, 21, 22, 23]);
      }

      // Verify theme rotation
      const week1Tasks = allTasks.filter((t) => t.week_of_month === 1);
      const week2Tasks = allTasks.filter((t) => t.week_of_month === 2);
      const week3Tasks = allTasks.filter((t) => t.week_of_month === 3);
      const week4Tasks = allTasks.filter((t) => t.week_of_month === 4);

      expect(week1Tasks.length).toBe(7 * 9);
      expect(week2Tasks.length).toBe(7 * 9);
      expect(week3Tasks.length).toBe(7 * 9);
      expect(week4Tasks.length).toBe(7 * 9);

      // Each week should have different themes
      const week1Themes = new Set(week1Tasks.map((t) => t.theme));
      const week2Themes = new Set(week2Tasks.map((t) => t.theme));
      const week3Themes = new Set(week3Tasks.map((t) => t.theme));
      const week4Themes = new Set(week4Tasks.map((t) => t.theme));

      expect(week1Themes.size).toBe(7); // 7 days = 7 different themes
      expect(week2Themes.size).toBe(7);
      expect(week3Themes.size).toBe(7);
      expect(week4Themes.size).toBe(7);

      // No theme should repeat across weeks
      const allThemes = [...week1Themes, ...week2Themes, ...week3Themes, ...week4Themes];
      expect(allThemes.length).toBe(28); // 4 weeks * 7 days = 28 unique themes

      const uniqueThemes = new Set(allThemes);
      expect(uniqueThemes.size).toBe(28); // All themes should be unique across the month
    });
  });
});