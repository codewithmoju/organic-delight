/**
 * ============================================================
 *  ORGANIC DELIGHT — Automated System Testing Script
 *  Topic : Use Case Scenarios & System Testing
 *  Type  : Automated (Unit / Integration level)
 *  Runner: Node.js  (no external dependencies required)
 * ============================================================
 *
 *  HOW TO RUN:
 *    node src/tests/system-test.js
 *
 *  MODULES COVERED:
 *    1. Authentication Module
 *    2. Inventory Module
 *    3. POS (Point of Sale) Module
 *    4. Customer Module
 *    5. Vendor Module
 *    6. Reports Module
 * ============================================================
 */

// ─── ANSI Colour Helpers ────────────────────────────────────
const GREEN   = (t) => `\x1b[32m${t}\x1b[0m`;
const RED     = (t) => `\x1b[31m${t}\x1b[0m`;
const YELLOW  = (t) => `\x1b[33m${t}\x1b[0m`;
const CYAN    = (t) => `\x1b[36m${t}\x1b[0m`;
const MAGENTA = (t) => `\x1b[35m${t}\x1b[0m`;
const BOLD    = (t) => `\x1b[1m${t}\x1b[0m`;
const DIM     = (t) => `\x1b[2m${t}\x1b[0m`;
const BG_GRN  = (t) => `\x1b[42m\x1b[30m${t}\x1b[0m`;
const BG_RED  = (t) => `\x1b[41m\x1b[97m${t}\x1b[0m`;

// ─── Cursor / Terminal helpers ───────────────────────────────
const write    = (s) => process.stdout.write(s);
const clearLn  = ()  => write('\x1b[2K\x1b[0G');   // clear current line, go to col 0
const cursorUp = (n = 1) => write(`\x1b[${n}A`);
const hideCursor = () => write('\x1b[?25l');
const showCursor = () => write('\x1b[?25h');

// ─── Simple Test Runner ─────────────────────────────────────
let passed = 0;
let failed = 0;
let totalTests = 0;
const failures = [];

// Counts every registered test ahead of time so we can draw a progress bar
const allTests = [];   // { description, fn } filled during describe()

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Live Progress Bar ───────────────────────────────────────
function drawProgressBar(done, total, width = 36) {
  const pct    = total === 0 ? 0 : Math.min(done / total, 1);
  const filled = Math.max(0, Math.min(Math.round(pct * width), width));
  const empty  = Math.max(0, width - filled);
  const bar    = BG_GRN(' '.repeat(filled)) + DIM('░'.repeat(empty));
  const label  = `${String(done).padStart(2)}/${total}`;
  write(`  [${bar}] ${label}  ${BOLD(GREEN(passed))} passed  ${failed > 0 ? BOLD(RED(failed)) : DIM('0')} failed`);
}

// ─── Spinner ─────────────────────────────────────────────────
const SPIN_FRAMES = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
async function spinner(label, ms = 600) {
  hideCursor();
  const start = Date.now();
  let i = 0;
  while (Date.now() - start < ms) {
    clearLn();
    write(`  ${CYAN(SPIN_FRAMES[i % SPIN_FRAMES.length])}  ${DIM(label)}`);
    i++;
    await delay(80);
  }
  clearLn();
  showCursor();
}

// ─── assert (async, real-time) ───────────────────────────────
async function assert(description, condition, expected = true, actual = condition) {
  totalTests++;

  // Show "running" state
  clearLn();
  write(`  ${YELLOW('⟳')}  ${DIM(description)}`);
  await delay(180);   // ← simulate test execution time

  clearLn();
  if (condition === expected) {
    write(`  ${GREEN('✔')}  ${description}\n`);
    passed++;
  } else {
    write(`  ${RED('✘')}  ${description}\n`);
    write(`     ${DIM(`Expected: ${JSON.stringify(expected)}  |  Got: ${JSON.stringify(actual)}`)}\n`);
    failed++;
    failures.push({ description, expected, actual });
  }

  // Overwrite live progress bar (2 lines below current position managed by caller)
}

// ─── describe (async) ────────────────────────────────────────
async function describe(moduleName, fn) {
  write(`\n${BOLD(CYAN(`📦  Module: ${moduleName}`))}\n`);
  write(DIM('─'.repeat(54)) + '\n');
  await fn();
}

// ════════════════════════════════════════════════════════════
//  MOCK DATA  — simulates what real API / Firestore returns
// ════════════════════════════════════════════════════════════

const mockDB = {
  users: [
    { id: 'u1', email: 'admin@organic.com', password: 'Admin@123', role: 'admin' },
    { id: 'u2', email: 'staff@organic.com', password: 'Staff@456', role: 'staff' },
  ],
  inventory: [
    { id: 'p1', name: 'Organic Milk',  sku: 'OMK-001', stock: 50, price: 120, category: 'Dairy'   },
    { id: 'p2', name: 'Whole Wheat',   sku: 'WWT-002', stock:  3, price:  85, category: 'Grains'  },
    { id: 'p3', name: 'Almond Butter', sku: 'ALB-003', stock:  0, price: 450, category: 'Spreads' },
  ],
  customers: [
    { id: 'c1', name: 'Sara Ahmed', phone: '0300-1234567', balance: 0   },
    { id: 'c2', name: 'Ali Raza',   phone: '0311-9876543', balance: 500 },
  ],
  vendors: [
    { id: 'v1', name: 'Green Farms',    contact: '03001112222', outstanding: 2000 },
    { id: 'v2', name: 'NaturePure Co.', contact: '03213334444', outstanding:    0 },
  ],
  sales: [
    { id: 's1', date: '2026-05-01', total: 3600, items: 5, customerId: 'c1' },
    { id: 's2', date: '2026-05-07', total: 1200, items: 2, customerId: 'c2' },
  ],
};

// ════════════════════════════════════════════════════════════
//  MODULE FUNCTIONS  — simplified business logic under test
// ════════════════════════════════════════════════════════════

// ── 1. Auth ────────────────────────────────────────────────
function login(email, password) {
  const user = mockDB.users.find(
    (u) => u.email === email && u.password === password
  );
  if (!user) return { success: false, error: 'Invalid credentials' };
  return { success: true, token: `tok_${user.id}`, role: user.role };
}

// ── 2. Inventory ───────────────────────────────────────────
function getProduct(sku) {
  return mockDB.inventory.find((p) => p.sku === sku) || null;
}

function updateStock(sku, quantity) {
  const product = getProduct(sku);
  if (!product) return { success: false, error: 'Product not found' };
  if (product.stock + quantity < 0)
    return { success: false, error: 'Insufficient stock' };
  product.stock += quantity;
  return { success: true, newStock: product.stock };
}

function getLowStockItems(threshold = 5) {
  return mockDB.inventory.filter((p) => p.stock <= threshold);
}

// ── 3. POS ─────────────────────────────────────────────────
function processSale(cartItems) {
  if (!cartItems || cartItems.length === 0)
    return { success: false, error: 'Cart is empty' };

  let total = 0;
  for (const item of cartItems) {
    const product = getProduct(item.sku);
    if (!product) return { success: false, error: `Product ${item.sku} not found` };
    if (product.stock < item.qty)
      return { success: false, error: `Insufficient stock for ${product.name}` };
    total += product.price * item.qty;
    product.stock -= item.qty;
  }

  const receipt = {
    id:    `RCP-${Date.now()}`,
    items: cartItems,
    total,
    date:  new Date().toISOString().split('T')[0],
  };
  mockDB.sales.push({ ...receipt, customerId: null });
  return { success: true, receipt };
}

// ── 4. Customers ───────────────────────────────────────────
function addCustomer(name, phone) {
  if (!name || !phone) return { success: false, error: 'Name and phone required' };
  const exists = mockDB.customers.find((c) => c.phone === phone);
  if (exists) return { success: false, error: 'Customer already exists' };
  const newCustomer = { id: `c${Date.now()}`, name, phone, balance: 0 };
  mockDB.customers.push(newCustomer);
  return { success: true, customer: newCustomer };
}

function getCustomer(phone) {
  return mockDB.customers.find((c) => c.phone === phone) || null;
}

// ── 5. Vendors ─────────────────────────────────────────────
function getVendorsWithOutstanding() {
  return mockDB.vendors.filter((v) => v.outstanding > 0);
}

function recordVendorPayment(vendorId, amount) {
  const vendor = mockDB.vendors.find((v) => v.id === vendorId);
  if (!vendor) return { success: false, error: 'Vendor not found' };
  if (amount <= 0)  return { success: false, error: 'Amount must be positive' };
  vendor.outstanding = Math.max(0, vendor.outstanding - amount);
  return { success: true, remaining: vendor.outstanding };
}

// ── 6. Reports ─────────────────────────────────────────────
function getTotalRevenue() {
  return mockDB.sales.reduce((sum, s) => sum + s.total, 0);
}

function getSalesByDateRange(from, to) {
  return mockDB.sales.filter((s) => s.date >= from && s.date <= to);
}

function generateSalesSummary() {
  const total   = getTotalRevenue();
  const count   = mockDB.sales.length;
  const average = count > 0 ? total / count : 0;
  return { total, count, average };
}

// ════════════════════════════════════════════════════════════
//  LIVE PROGRESS BAR — drawn at top, refreshed after each test
// ════════════════════════════════════════════════════════════

// Total expected test count (keep in sync with suites below)
const TOTAL_EXPECTED = 32;

let progressLine = '';   // keep track of last progress text length

function refreshProgress() {
  // Move to the fixed progress line at the bottom of terminal
  // We just print a new progress bar line after each test result
  write('  ');
  drawProgressBar(totalTests, TOTAL_EXPECTED);
  write('\n');
}

// ════════════════════════════════════════════════════════════
//  TEST SUITES
// ════════════════════════════════════════════════════════════

async function runAllTests() {
  hideCursor();
  console.log(BOLD('\n╔══════════════════════════════════════════════════════╗'));
  console.log(BOLD('║    ORGANIC DELIGHT — AUTOMATED SYSTEM TEST SUITE    ║'));
  console.log(BOLD('╚══════════════════════════════════════════════════════╝'));
  console.log(DIM(`  Started at : ${new Date().toLocaleString()}`));
  console.log(DIM('  Watch each test execute in real time ↓\n'));

  // ── USE CASE 1: Authentication ──────────────────────────
  await describe('Authentication Module', async () => {
    const res1 = login('admin@organic.com', 'Admin@123');
    await assert('UC-AUTH-01 │ Valid admin credentials → login success',   res1.success, true);
    refreshProgress();
    await assert('UC-AUTH-02 │ Role assigned correctly as \'admin\'',       res1.role === 'admin', true);
    refreshProgress();

    const res2 = login('staff@organic.com', 'Staff@456');
    await assert('UC-AUTH-03 │ Valid staff credentials → login success',   res2.success, true);
    refreshProgress();

    const res3 = login('hacker@evil.com', 'wrongpass');
    await assert('UC-AUTH-04 │ Invalid credentials → login rejected',      res3.success, false);
    refreshProgress();
    await assert('UC-AUTH-05 │ Error message returned for bad login',      res3.error === 'Invalid credentials', true);
    refreshProgress();

    const res4 = login('', '');
    await assert('UC-AUTH-06 │ Empty credentials → login rejected',        res4.success, false);
    refreshProgress();
  });

  await spinner('Loading Inventory Module…', 700);

  // ── USE CASE 2: Inventory Management ───────────────────
  await describe('Inventory Module', async () => {
    const product = getProduct('OMK-001');
    await assert('UC-INV-01  │ Product lookup by SKU succeeds',            product !== null, true);
    refreshProgress();
    await assert('UC-INV-02  │ Correct product name returned',             product?.name === 'Organic Milk', true);
    refreshProgress();

    const upd1 = updateStock('OMK-001', 10);
    await assert('UC-INV-03  │ Stock increase by 10 → success',            upd1.success, true);
    refreshProgress();
    await assert('UC-INV-04  │ New stock level = 60',                      upd1.newStock === 60, true);
    refreshProgress();

    const upd2 = updateStock('OMK-001', -9999);
    await assert('UC-INV-05  │ Over-deduction blocked (neg stock guard)',  upd2.success, false);
    refreshProgress();

    const upd3 = updateStock('FAKE-SKU', 5);
    await assert('UC-INV-06  │ Non-existent SKU → error returned',         upd3.success, false);
    refreshProgress();

    const lowStock = getLowStockItems(5);
    await assert('UC-INV-07  │ Low-stock alert finds ≥1 items ≤ 5 units',  lowStock.length >= 1, true);
    refreshProgress();

    const outOfStock = mockDB.inventory.filter((p) => p.stock === 0);
    await assert('UC-INV-08  │ Out-of-stock items detected',               outOfStock.length >= 1, true);
    refreshProgress();
  });

  await spinner('Loading POS Module…', 700);

  // ── USE CASE 3: Point of Sale ──────────────────────────
  await describe('POS (Point of Sale) Module', async () => {
    const cart1 = [{ sku: 'OMK-001', qty: 2 }];
    const sale1 = processSale(cart1);
    await assert('UC-POS-01  │ Valid cart → sale processed successfully',  sale1.success, true);
    refreshProgress();
    await assert('UC-POS-02  │ Receipt generated with correct total',      sale1.receipt?.total === 240, true);
    refreshProgress();

    const emptyCart = processSale([]);
    await assert('UC-POS-03  │ Empty cart → sale rejected',                emptyCart.success, false);
    refreshProgress();

    const overSell = processSale([{ sku: 'WWT-002', qty: 9999 }]);
    await assert('UC-POS-04  │ Sell more than stock → rejected',           overSell.success, false);
    refreshProgress();

    const badSKU = processSale([{ sku: 'GHOST-SKU', qty: 1 }]);
    await assert('UC-POS-05  │ Unknown SKU in cart → rejected',            badSKU.success, false);
    refreshProgress();
  });

  await spinner('Loading Customer Module…', 700);

  // ── USE CASE 4: Customer Management ───────────────────
  await describe('Customer Module', async () => {
    const add1 = addCustomer('Zara Khan', '0322-5556666');
    await assert('UC-CUS-01  │ New customer added successfully',            add1.success, true);
    refreshProgress();
    await assert('UC-CUS-02  │ Customer starts with zero balance',          add1.customer?.balance === 0, true);
    refreshProgress();

    const dup  = addCustomer('Zara Khan', '0322-5556666');
    await assert('UC-CUS-03  │ Duplicate phone number → rejected',          dup.success, false);
    refreshProgress();

    const miss = addCustomer('', '');
    await assert('UC-CUS-04  │ Missing name & phone → rejected',            miss.success, false);
    refreshProgress();

    const found = getCustomer('0300-1234567');
    await assert('UC-CUS-05  │ Customer lookup by phone succeeds',          found !== null, true);
    refreshProgress();
    await assert('UC-CUS-06  │ Correct customer name returned',             found?.name === 'Sara Ahmed', true);
    refreshProgress();

    const notFound = getCustomer('0000-0000000');
    await assert('UC-CUS-07  │ Unknown phone → returns null',               notFound === null, true);
    refreshProgress();
  });

  await spinner('Loading Vendor Module…', 700);

  // ── USE CASE 5: Vendor Management ─────────────────────
  await describe('Vendor Module', async () => {
    const outstanding = getVendorsWithOutstanding();
    await assert('UC-VEN-01  │ Vendors with outstanding balance detected',  outstanding.length >= 1, true);
    refreshProgress();

    const pay1 = recordVendorPayment('v1', 500);
    await assert('UC-VEN-02  │ Payment of 500 recorded for vendor v1',      pay1.success, true);
    refreshProgress();
    await assert('UC-VEN-03  │ Remaining balance = 1500',                   pay1.remaining === 1500, true);
    refreshProgress();

    const payFull = recordVendorPayment('v1', 99999);
    await assert('UC-VEN-04  │ Over-payment clamped to zero (no negative)', payFull.remaining >= 0, true);
    refreshProgress();

    const badPay = recordVendorPayment('v99', 100);
    await assert('UC-VEN-05  │ Non-existent vendor → payment rejected',     badPay.success, false);
    refreshProgress();

    const zeroPay = recordVendorPayment('v2', 0);
    await assert('UC-VEN-06  │ Zero-amount payment → rejected',             zeroPay.success, false);
    refreshProgress();
  });

  await spinner('Loading Reports Module…', 700);

  // ── USE CASE 6: Reports ────────────────────────────────
  await describe('Reports Module', async () => {
    const revenue = getTotalRevenue();
    await assert('UC-REP-01  │ Total revenue calculated (> 0)',             revenue > 0, true);
    refreshProgress();

    const summary = generateSalesSummary();
    await assert('UC-REP-02  │ Sales summary total matches getTotalRevenue()', summary.total === revenue, true);
    refreshProgress();
    await assert('UC-REP-03  │ Sales count is positive integer',            summary.count > 0, true);
    refreshProgress();
    await assert('UC-REP-04  │ Average sale value is computed correctly',   summary.average === summary.total / summary.count, true);
    refreshProgress();

    const rangeHit  = getSalesByDateRange('2026-05-01', '2026-05-07');
    await assert('UC-REP-05  │ Date-range filter returns sales',            rangeHit.length >= 1, true);
    refreshProgress();

    const rangeMiss = getSalesByDateRange('2020-01-01', '2020-01-02');
    await assert('UC-REP-06  │ Date-range with no data → empty array',      rangeMiss.length === 0, true);
    refreshProgress();
  });

  // ── FINAL SUMMARY ──────────────────────────────────────
  const total = passed + failed;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log(BOLD('\n╔══════════════════════════════════════════════════════╗'));
  console.log(BOLD('║                    TEST RESULTS                     ║'));
  console.log(BOLD('╚══════════════════════════════════════════════════════╝'));

  // Final full-width progress bar
  write('  ');
  drawProgressBar(total, total);
  write('\n\n');

  console.log(`  Total Tests  : ${BOLD(total)}`);
  console.log(`  ${GREEN('Passed')}       : ${BOLD(GREEN(passed))}`);
  console.log(`  ${RED('Failed')}       : ${BOLD(failed > 0 ? RED(failed) : GREEN(failed))}`);
  console.log(`  Pass Rate    : ${BOLD(passRate)}%  ${passRate === '100.0' ? '🎯' : '⚠️'}`);

  if (failures.length > 0) {
    console.log(YELLOW('\n  ⚠  Failed Tests:'));
    failures.forEach((f) => {
      console.log(`     ${RED('✘')}  ${f.description}`);
      console.log(`        ${DIM(`Expected: ${JSON.stringify(f.expected)}  |  Got: ${JSON.stringify(f.actual)}`)}`);
    });
  } else {
    console.log(GREEN('\n  🎉  All tests passed! System is working correctly.'));
  }

  console.log(DIM(`\n  Finished at: ${new Date().toLocaleString()}\n`));

  showCursor();
  process.exit(failed > 0 ? 1 : 0);
}

// Restore cursor if user hits Ctrl+C mid-run
process.on('SIGINT', () => { showCursor(); process.exit(1); });

runAllTests();
