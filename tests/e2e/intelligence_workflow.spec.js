const { test, expect } = require('@playwright/test');

test.describe('End-to-End Event Intelligence Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Login as an admin before each test
        await page.goto('http://localhost:5173/login');
        await page.fill('input[name="email"]', 'admin@infosys.com');
        await page.fill('input[name="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL('http://localhost:5173/admin-dashboard');
    });

    test('should automatically detect high crowd density and trigger recommendation', async ({ page, request }) => {
        // 1. Simulate a large number of attendee check-ins via backend API
        const eventId = 1; // Assuming event ID 1 exists
        for(let i = 0; i < 90; i++) {
            await request.post('http://localhost:5000/api/admin/scan', {
                data: {
                    registrationId: `TEST-REG-${i}`,
                    eventId: eventId
                }
            });
        }

        // 2. Navigate to Executive Command Center
        await page.click('text=Command Center');
        
        // 3. Verify the Event Intelligence Engine generated the warning
        await expect(page.locator('text=Hall capacity has reached 90%')).toBeVisible({ timeout: 15000 });
        
        // 4. Verify the Actionable Recommendation is present in the feed
        const recommendationCard = page.locator('text=High crowd density is expected at Hall A. Consider deploying additional check-in staff');
        await expect(recommendationCard).toBeVisible();

        // 5. Admin approves the action
        await page.click('button:has-text("Approve Action")');
        
        // Ensure action was marked as resolved/implemented
        await expect(recommendationCard).not.toBeVisible();
    });
});
