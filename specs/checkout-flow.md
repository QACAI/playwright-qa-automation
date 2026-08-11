# Sauce Demo - Checkout Flow Test Plan

## Application Overview

Sauce Demo (https://www.saucedemo.com) is a demo e-commerce application used for testing automation tools. This test plan focuses on the end-to-end checkout flow: logging in as a standard user, adding a product to the cart, and completing the checkout process (shipping information entry, order review, and order confirmation). It also covers key validation, negative, and boundary scenarios encountered while exploring the live application, including required-field validation on the checkout information step, cancel/navigation behavior, and cart state changes across the flow.

Key facts verified during exploration:
- Login page (https://www.saucedemo.com/) has Username and Password fields (data-testid="username"/"password") and a Login button (data-testid="login-button"). Valid standard user credentials: standard_user / secret_sauce.
- After login, user lands on /inventory.html (Products page) listing 6 items, each with an "Add to cart" button that toggles to "Remove" once added, and a cart badge icon showing item count.
- Cart page (/cart.html) lists QTY/Description for each item, with "Continue Shopping" and "Checkout" buttons. The Checkout button is present and clickable even when the cart is empty.
- Checkout Step One (/checkout-step-one.html, "Checkout: Your Information") has First Name, Last Name, and Zip/Postal Code text fields, and Cancel / Continue buttons. Clicking Continue with missing fields shows inline errors in this order of precedence: "Error: First Name is required", then "Error: Last Name is required", then "Error: Postal Code is required". Cancel returns to the cart page.
- Checkout Step Two (/checkout-step-two.html, "Checkout: Overview") shows cart item(s), Payment Information ("SauceCard #31337"), Shipping Information ("Free Pony Express Delivery!"), Item total, Tax, and Total, plus Cancel and Finish buttons.
- Checkout Complete (/checkout-complete.html, "Checkout: Complete!") shows a Pony Express image, "Thank you for your order!" heading, a confirmation message, and "Back Home" and "Generate PDF order" buttons. Clicking "Back Home" returns to /inventory.html and the cart is cleared (badge disappears, "Add to cart" buttons are restored).

## Test Scenarios

### 1. Standard Checkout Flow

**Seed:** `tests/seed.spec.ts`

#### 1.1. Successful checkout with a single item (happy path)

**File:** `tests/checkout-flow/successful-checkout-single-item.spec.ts`

**Steps:**
  1. Navigate to https://www.saucedemo.com/
    - expect: Login page is displayed with Username and Password fields and a Login button
  2. Enter 'standard_user' in the Username field and 'secret_sauce' in the Password field, then click Login
    - expect: User is redirected to /inventory.html
    - expect: Page header shows 'Products'
  3. Locate the 'Sauce Labs Backpack' product and click its 'Add to cart' button
    - expect: The button label changes from 'Add to cart' to 'Remove'
    - expect: The cart icon in the header shows a badge with count '1'
  4. Click the shopping cart icon in the header
    - expect: User is navigated to /cart.html
    - expect: Page header shows 'Your Cart'
    - expect: The cart lists 'Sauce Labs Backpack' with QTY 1 and price $29.99
    - expect: 'Continue Shopping' and 'Checkout' buttons are visible
  5. Click the 'Checkout' button
    - expect: User is navigated to /checkout-step-one.html
    - expect: Page header shows 'Checkout: Your Information'
    - expect: First Name, Last Name, and Zip/Postal Code fields are visible along with Cancel and Continue buttons
  6. Enter 'John' in First Name, 'Doe' in Last Name, and '12345' in Zip/Postal Code, then click Continue
    - expect: User is navigated to /checkout-step-two.html
    - expect: Page header shows 'Checkout: Overview'
  7. Review the order overview page
    - expect: 'Sauce Labs Backpack' is listed with QTY 1 and price $29.99
    - expect: Payment Information shows 'SauceCard #31337'
    - expect: Shipping Information shows 'Free Pony Express Delivery!'
    - expect: Item total shows $29.99, Tax shows $2.40, and Total shows $32.39 (Item total + Tax)
    - expect: Cancel and Finish buttons are visible
  8. Click the 'Finish' button
    - expect: User is navigated to /checkout-complete.html
    - expect: Page header shows 'Checkout: Complete!'
    - expect: A Pony Express image is displayed
    - expect: Heading 'Thank you for your order!' is displayed
    - expect: Confirmation text 'Your order has been dispatched, and will arrive just as fast as the pony can get there!' is displayed
    - expect: 'Back Home' and 'Generate PDF order' buttons are visible
  9. Click the 'Back Home' button
    - expect: User is navigated back to /inventory.html
    - expect: The cart badge is no longer visible (cart is empty)
    - expect: The 'Sauce Labs Backpack' product button reverts to 'Add to cart'

#### 1.2. Successful checkout with multiple items

**File:** `tests/checkout-flow/successful-checkout-multiple-items.spec.ts`

**Steps:**
  1. Navigate to https://www.saucedemo.com/ and log in with standard_user / secret_sauce
    - expect: User lands on /inventory.html
  2. Click 'Add to cart' for 'Sauce Labs Backpack', 'Sauce Labs Bike Light', and 'Sauce Labs Bolt T-Shirt'
    - expect: Each button changes to 'Remove'
    - expect: The cart badge shows count '3'
  3. Click the shopping cart icon and review the cart
    - expect: All three items are listed with correct names and prices ($29.99, $9.99, $15.99) and QTY 1 each
  4. Click 'Checkout', fill in First Name, Last Name, and Zip/Postal Code with valid values, then click Continue
    - expect: User reaches the Checkout: Overview page listing all three items
  5. Verify pricing on the overview page
    - expect: Item total equals the sum of the three item prices ($55.97)
    - expect: Tax and Total are calculated correctly (Total = Item total + Tax)
  6. Click 'Finish'
    - expect: Order completes successfully and the 'Checkout: Complete!' confirmation page is displayed

#### 1.3. Remove item from cart before checkout

**File:** `tests/checkout-flow/remove-item-before-checkout.spec.ts`

**Steps:**
  1. Log in as standard_user and add 'Sauce Labs Backpack' and 'Sauce Labs Bike Light' to the cart
    - expect: Cart badge shows count '2'
  2. Navigate to the cart page and click 'Remove' next to 'Sauce Labs Bike Light'
    - expect: 'Sauce Labs Bike Light' is removed from the cart list
    - expect: Cart badge count updates to '1'
  3. Proceed through Checkout (fill in valid shipping info and continue) to the Overview page
    - expect: Only 'Sauce Labs Backpack' appears in the order overview
    - expect: Item total reflects only the remaining item's price ($29.99)
  4. Click 'Finish'
    - expect: Order completes successfully showing the confirmation page

### 2. Checkout Information Validation (Negative Tests)

**Seed:** `tests/seed.spec.ts`

#### 2.1. Error shown when submitting checkout form with all fields empty

**File:** `tests/checkout-flow/validation-all-fields-empty.spec.ts`

**Steps:**
  1. Log in as standard_user, add 'Sauce Labs Backpack' to the cart, and navigate to the cart page
    - expect: Item is present in the cart
  2. Click 'Checkout' to reach the 'Checkout: Your Information' page
    - expect: First Name, Last Name, and Zip/Postal Code fields are empty
  3. Without entering any values, click 'Continue'
    - expect: User remains on /checkout-step-one.html
    - expect: An inline error message 'Error: First Name is required' is displayed
    - expect: The First Name field is visually flagged (e.g., red outline/error icon)

#### 2.2. Error shown when Last Name is missing

**File:** `tests/checkout-flow/validation-missing-last-name.spec.ts`

**Steps:**
  1. Log in as standard_user, add an item to the cart, and navigate to the checkout information page
    - expect: Checkout: Your Information page is displayed
  2. Enter 'John' in the First Name field only, leave Last Name and Zip/Postal Code empty, then click 'Continue'
    - expect: User remains on /checkout-step-one.html
    - expect: Error message 'Error: Last Name is required' is displayed

#### 2.3. Error shown when Postal Code is missing

**File:** `tests/checkout-flow/validation-missing-postal-code.spec.ts`

**Steps:**
  1. Log in as standard_user, add an item to the cart, and navigate to the checkout information page
    - expect: Checkout: Your Information page is displayed
  2. Enter 'John' in First Name and 'Doe' in Last Name, leave Zip/Postal Code empty, then click 'Continue'
    - expect: User remains on /checkout-step-one.html
    - expect: Error message 'Error: Postal Code is required' is displayed
  3. Enter '12345' in the Zip/Postal Code field and click 'Continue'
    - expect: Validation error clears
    - expect: User is navigated to the 'Checkout: Overview' page

#### 2.4. Error message can be dismissed

**File:** `tests/checkout-flow/validation-dismiss-error.spec.ts`

**Steps:**
  1. Log in as standard_user, add an item to the cart, and navigate to the checkout information page
    - expect: Checkout: Your Information page is displayed
  2. Click 'Continue' with all fields empty to trigger the 'First Name is required' error
    - expect: Error banner with a close (X) icon is displayed
  3. Click the close (X) icon on the error banner
    - expect: The error message is dismissed/hidden
    - expect: The form fields remain empty and editable

### 3. Navigation and Cancel Behavior

**Seed:** `tests/seed.spec.ts`

#### 3.1. Cancel on Checkout Information step returns to cart

**File:** `tests/checkout-flow/cancel-step-one.spec.ts`

**Steps:**
  1. Log in as standard_user, add 'Sauce Labs Backpack' to the cart, and proceed to Checkout
    - expect: Checkout: Your Information page is displayed
  2. Without filling in the form, click the 'Cancel' button
    - expect: User is navigated back to /cart.html
    - expect: The 'Sauce Labs Backpack' item is still present in the cart (item is preserved, not removed)

#### 3.2. Cancel on Checkout Overview step returns to cart

**File:** `tests/checkout-flow/cancel-step-two.spec.ts`

**Steps:**
  1. Log in as standard_user, add an item to the cart, proceed to checkout, and fill in valid shipping information, then click Continue
    - expect: User reaches the 'Checkout: Overview' page
  2. Click the 'Cancel' button on the overview page
    - expect: User is navigated back to /cart.html
    - expect: The cart item(s) are still present

#### 3.3. Continue Shopping button from cart returns to product listing

**File:** `tests/checkout-flow/continue-shopping.spec.ts`

**Steps:**
  1. Log in as standard_user, add an item to the cart, and navigate to the cart page
    - expect: Cart page is displayed with the added item
  2. Click the 'Continue Shopping' button
    - expect: User is navigated back to /inventory.html
    - expect: The cart badge still reflects the previously added item(s)

#### 3.4. Checkout with an empty cart

**File:** `tests/checkout-flow/empty-cart-checkout.spec.ts`

**Steps:**
  1. Log in as standard_user and navigate directly to the cart page without adding any items
    - expect: Cart page shows no items and no cart badge count
    - expect: 'Checkout' button is still visible/enabled
  2. Click 'Checkout'
    - expect: User is navigated to /checkout-step-one.html (application allows proceeding even with an empty cart)
  3. Fill in valid First Name, Last Name, and Zip/Postal Code, then click 'Continue'
    - expect: User reaches the 'Checkout: Overview' page with no line items listed and Item total/Tax/Total reflecting $0.00 values or equivalent empty state

#### 3.5. Refreshing the checkout overview page preserves or resets appropriately

**File:** `tests/checkout-flow/refresh-overview-page.spec.ts`

**Steps:**
  1. Log in as standard_user, add an item to the cart, proceed through checkout to the Overview page
    - expect: Checkout: Overview page is displayed with the item and pricing
  2. Refresh the browser page
    - expect: Document current behavior: verify whether the item/pricing data persists after refresh or whether the user is redirected/data is lost, and assert against the actual expected behavior of the app

### 4. Cart State and Data Integrity

**Seed:** `tests/seed.spec.ts`

#### 4.1. Cart badge count updates correctly when adding and removing items

**File:** `tests/checkout-flow/cart-badge-updates.spec.ts`

**Steps:**
  1. Log in as standard_user
    - expect: No cart badge is shown initially
  2. Add 'Sauce Labs Backpack' to the cart
    - expect: Cart badge shows '1'
  3. Add 'Sauce Labs Bike Light' to the cart
    - expect: Cart badge shows '2'
  4. Click 'Remove' on 'Sauce Labs Backpack' from the inventory page
    - expect: Cart badge shows '1'
  5. Navigate to the cart page and click 'Remove' on the remaining item
    - expect: Cart badge disappears (no items in cart)
    - expect: Cart page shows an empty item list

#### 4.2. Order total calculation is correct (item total, tax, and grand total)

**File:** `tests/checkout-flow/order-total-calculation.spec.ts`

**Steps:**
  1. Log in as standard_user and add 'Sauce Labs Backpack' ($29.99) to the cart
    - expect: Item added successfully
  2. Proceed through checkout with valid shipping info to the Overview page
    - expect: Item total displayed as $29.99
  3. Verify the Tax value shown
    - expect: Tax is displayed as $2.40 (approximately 8% of item total)
  4. Verify the Total value shown
    - expect: Total equals Item total + Tax = $32.39

#### 4.3. Cart is emptied after successful order completion

**File:** `tests/checkout-flow/cart-cleared-after-order.spec.ts`

**Steps:**
  1. Log in as standard_user, add an item to the cart, and complete the full checkout flow (Checkout > fill info > Continue > Finish)
    - expect: Order confirmation 'Checkout: Complete!' page is displayed
  2. Click 'Back Home' to return to the inventory page
    - expect: No cart badge is visible on the inventory page
  3. Navigate directly to the cart page (/cart.html)
    - expect: Cart page shows no items in the list
    - expect: 'Checkout' button is still present but the cart contains no line items
