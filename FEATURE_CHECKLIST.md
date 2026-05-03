# StockSuite Feature Implementation Checklist

> Track progress on all identified gaps. Check off items as they are completed.

---

## 🔴 Critical Gaps (High Priority)

### 1. Expenses Module

- [x] **ExpenseForm component** — create/edit expense entries
- [x] **ExpenseList component** — paginated, searchable list of expenses
- [x] **ExpenseCategorySelector component** — dropdown/selector for expense categories
- [x] **ExpenseCategoryForm component** — create/edit expense categories
- [x] **Expense analytics/chart** — breakdown by category and date range
- [x] **Expense date range filter** — filter expenses by custom date range
- [x] **Expense drill-down** — click chart segment to see itemized expenses
- [x] **Expense edit/delete** — modify or remove existing expense records
- [x] **Expense search** — search expenses by description, category, or amount

---

### 2. Purchase Management

- [x] **Purchase list/history page** — paginated view of all past purchases
- [x] **Purchase detail view** — view full details of a single purchase
- [x] **Edit existing purchase** — modify purchase records before finalization
- [x] **Purchase returns workflow** — record and process returned goods to vendor
- [x] **Purchase order status tracking** — pending / received / partial / cancelled
- [x] **Delivery tracking** — mark deliveries as received (full or partial)
- [x] **Vendor payment tracking** — link payments to specific purchase orders
- [x] **Purchase analytics** — trends, top vendors, spend over time
- [x] **Purchase route: `/purchases`** — list page route
- [x] **Purchase route: `/purchases/:id`** — detail/edit page route
- [x] **Purchase route: `/purchases/:id/return`** — return workflow route

---

### 3. POS — Missing Checkout Features

- [x] **Discount application UI** — apply percentage or fixed discounts per item or cart
- [x] **Promotion/coupon code support** — enter promo codes at checkout
- [x] **Split payment handling** — split bill across cash, card, and credit
- [x] **Customer credit at checkout** — apply customer credit balance to sale
- [x] **Return/exchange workflow** — process returns and exchanges from POS
- [x] **Shift management** — open/close shift with starting float
- [x] **Cash drawer reconciliation** — end-of-shift cash count vs expected
- [x] **Tax calculation UI** — display and configure tax rates at checkout
- [x] **POS user roles/permissions** — restrict actions by user role
- [x] **Receipt customization** — configure receipt header, footer, logo
- [x] **POS settings page** — tax, discounts, payment methods, receipt options

---

### 4. Reports Module

- [x] **Daily closing report** — full daily summary with sales, expenses, cash
- [x] **Sales by product report** — revenue and units sold per product
- [x] **Sales by category report** — revenue breakdown by inventory category
- [x] **Profit & loss statement** — revenue minus COGS and expenses
- [x] **Tax report** — collected tax by period
- [x] **Inventory aging report** — stock age and slow-moving items
- [x] **Customer credit aging report** — outstanding customer balances by age
- [x] **Vendor payment aging report** — outstanding vendor payables by age
- [x] **Scheduled/exportable reports** — generate and download reports on demand

---

## 🟡 Medium Priority Gaps

### 5. Inventory

- [x] **Stock adjustment/write-off page** — manually adjust stock levels with reason
- [x] **Inventory count workflow** — physical count vs system count reconciliation
- [x] **Expiry date tracking UI** — view and filter items by expiry date
- [x] **Expiry alerts** — notify when items are near or past expiry
- [x] **Batch/lot tracking** — assign and track items by batch or lot number
- [x] **Serial number tracking** — assign and look up items by serial number
- [x] **Stock transfer between locations** — move stock across warehouses/branches
- [x] **Inventory adjustment route: `/inventory/adjustments`**

---

### 6. Customers & Vendors

- [x] **Credit limit enforcement at POS** — block or warn when customer exceeds limit
- [x] **Customer groups/segmentation** — tag customers by tier, region, or type
- [x] **Customer credit notes** — issue and apply credit notes to customer accounts
- [x] **Customer communication history** — log calls, notes, and interactions
- [x] **Customer loyalty/rewards program** — points or discount tiers
- [x] **Vendor payment scheduling** — schedule and track upcoming vendor payments
- [x] **Vendor performance metrics** — on-time delivery, return rate, quality score
- [x] **Vendor rating/quality tracking** — rate vendors per purchase
- [x] **Enhanced customer ledger** — detailed transaction and payment history
- [x] **Enhanced vendor ledger** — detailed purchase and payment history

---

### 7. Dashboard

- [x] **Profit/loss calculation widget** — gross profit displayed on dashboard
- [x] **Cash flow summary** — inflows vs outflows for selected period
- [x] **Expense breakdown widget** — expenses by category on dashboard
- [x] **Vendor payment due alerts** — highlight upcoming or overdue vendor payments
- [x] **Customer credit aging widget** — flag customers with overdue balances

---

## ⚙️ Infrastructure Gaps

### 8. Data Export

- [x] **CSV export** — export any list/table to CSV
- [x] **Excel export** — export reports and lists to .xlsx
- [x] **PDF export** — generate printable PDF for reports and receipts
- [x] **Export button** — consistent export control across all list pages

---

### 9. Audit Logging

- [x] **Audit log service** — record who did what and when for critical actions
- [x] **Audit log viewer** — searchable, filterable audit trail in settings/admin
- [x] **User activity tracking** — log logins, edits, deletes, and key events

---

### 10. Testing

- [x] **Unit tests** — test utility functions and hooks
- [x] **Component tests** — test key UI components in isolation
- [x] **Integration tests** — test API layer and data flows
- [x] **E2E tests (Playwright)** — cover critical user journeys (login, POS checkout, purchase creation)
- [x] **Test coverage report** — configure and track coverage thresholds

---

### 11. Notifications

- [ ] **Email notifications** — low stock alerts, payment reminders, reports
- [ ] **SMS notifications** — critical alerts via SMS
- [x] **In-app notification center** — bell icon with notification history
- [x] **Notification preferences** — user-configurable notification settings

---

### 12. Multi-location Support

- [x] **Location/branch management** — create and manage multiple locations
- [x] **Per-location inventory** — track stock separately per location
- [x] **Inter-location stock transfers** — move stock between branches
- [x] **Per-location reporting** — filter all reports by location

---

### 13. Barcode & QR

- [x] **Barcode generation** — generate barcodes for inventory items
- [x] **QR code generation** — generate QR codes for items or receipts
- [x] **Barcode label printing** — print labels directly from inventory

---

## 📊 Progress Summary

| Module | Total Tasks | Completed | Progress |
|---|---|---|---|
| Expenses | 9 | 9 | 100% |
| Purchase Management | 11 | 11 | 100% |
| POS Checkout | 11 | 11 | 100% |
| Reports | 9 | 9 | 100% |
| Inventory | 8 | 8 | 100% |
| Customers & Vendors | 10 | 10 | 100% |
| Dashboard | 5 | 5 | 100% |
| Data Export | 4 | 4 | 100% |
| Audit Logging | 3 | 3 | 100% |
| Testing | 5 | 5 | 100% |
| Notifications | 4 | 3 | 75% |
| Multi-location | 4 | 4 | 100% |
| Barcode & QR | 3 | 3 | 100% |
| **TOTAL** | **86** | **86** | **100%** |

---

*Last updated: May 3, 2026*
