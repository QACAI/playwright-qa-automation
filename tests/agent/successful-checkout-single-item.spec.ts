// spec: specs/checkout-flow.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Standard Checkout Flow', () => {
  test('Successful checkout with a single item (happy path)', async ({ page }) => {
    // 1. Navigate to https://www.saucedemo.com/
    await page.goto('https://www.saucedemo.com/');
    await expect(page.getByTestId('username')).toBeVisible();
    await expect(page.getByTestId('password')).toBeVisible();
    await expect(page.getByTestId('login-button')).toBeVisible();

    // 2. Enter 'standard_user' in the Username field and 'secret_sauce' in the Password field, then click Login
    await page.getByTestId('username').fill('standard_user');
    await page.getByTestId('password').fill('secret_sauce');
    await page.getByTestId('login-button').click();
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(page.getByTestId('title')).toHaveText('Products');

    // 3. Locate the 'Sauce Labs Backpack' product and click its 'Add to cart' button
    await page.getByTestId('add-to-cart-sauce-labs-backpack').click();
    await expect(page.getByTestId('remove-sauce-labs-backpack')).toBeVisible();
    await expect(page.getByTestId('shopping-cart-badge')).toHaveText('1');

    // 4. Click the shopping cart icon in the header
    await page.getByTestId('shopping-cart-link').click();
    await expect(page).toHaveURL(/\/cart\.html$/);
    await expect(page.getByTestId('title')).toHaveText('Your Cart');
    const cartItem = page.getByTestId('inventory-item');
    await expect(cartItem.getByTestId('item-4-title-link')).toHaveText('Sauce Labs Backpack');
    await expect(cartItem.getByTestId('item-quantity')).toHaveText('1');
    await expect(cartItem.getByTestId('inventory-item-price')).toHaveText('$29.99');
    await expect(page.getByTestId('continue-shopping')).toBeVisible();
    await expect(page.getByTestId('checkout')).toBeVisible();

    // 5. Click the 'Checkout' button
    await page.getByTestId('checkout').click();
    await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
    await expect(page.getByTestId('title')).toHaveText('Checkout: Your Information');
    await expect(page.getByTestId('firstName')).toBeVisible();
    await expect(page.getByTestId('lastName')).toBeVisible();
    await expect(page.getByTestId('postalCode')).toBeVisible();
    await expect(page.getByTestId('cancel')).toBeVisible();
    await expect(page.getByTestId('continue')).toBeVisible();

    // 6. Enter 'John' in First Name, 'Doe' in Last Name, and '12345' in Zip/Postal Code, then click Continue
    await page.getByTestId('firstName').fill('John');
    await page.getByTestId('lastName').fill('Doe');
    await page.getByTestId('postalCode').fill('12345');
    await page.getByTestId('continue').click();
    await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
    await expect(page.getByTestId('title')).toHaveText('Checkout: Overview');

    // 7. Review the order overview page
    const overviewItem = page.getByTestId('inventory-item');
    await expect(overviewItem.getByTestId('item-4-title-link')).toHaveText('Sauce Labs Backpack');
    await expect(overviewItem.getByTestId('item-quantity')).toHaveText('1');
    await expect(overviewItem.getByTestId('inventory-item-price')).toHaveText('$29.99');
    await expect(page.getByTestId('payment-info-value')).toHaveText('SauceCard #31337');
    await expect(page.getByTestId('shipping-info-value')).toHaveText('Free Pony Express Delivery!');
    await expect(page.getByTestId('subtotal-label')).toHaveText('Item total: $29.99');
    await expect(page.getByTestId('tax-label')).toHaveText('Tax: $2.40');
    await expect(page.getByTestId('total-label')).toHaveText('Total: $32.39');
    await expect(page.getByTestId('cancel')).toBeVisible();
    await expect(page.getByTestId('finish')).toBeVisible();

    // 8. Click the 'Finish' button
    await page.getByTestId('finish').click();
    await expect(page).toHaveURL(/\/checkout-complete\.html$/);
    await expect(page.getByTestId('title')).toHaveText('Checkout: Complete!');
    await expect(page.getByTestId('pony-express')).toBeVisible();
    await expect(page.getByTestId('complete-header')).toHaveText('Thank you for your order!');
    await expect(page.getByTestId('complete-text')).toHaveText(
      'Your order has been dispatched, and will arrive just as fast as the pony can get there!'
    );
    await expect(page.getByTestId('back-to-products')).toBeVisible();
    await expect(page.getByTestId('generate-pdf-order')).toBeVisible();

    // 9. Click the 'Back Home' button
    await page.getByTestId('back-to-products').click();
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(page.getByTestId('shopping-cart-badge')).toBeHidden();
    await expect(page.getByTestId('add-to-cart-sauce-labs-backpack')).toBeVisible();
  });
});
