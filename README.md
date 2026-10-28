# Bill01

Build a simple, clean web app called **Monthly House Bill Tracker**.

### Main Goal
I want a very simple application to manage my monthly house rent and electricity bills. The house, tenant, and monthly rent will remain the same. Every month, I will enter the new electricity meter reading, and the app will calculate the bill, save the data, and generate a receipt.

### 1. Simple Settings
Allow me to set and save:
- House/tenant name
- House address or room number
- Monthly house rent
- Monthly gas bill
- Electricity rate per unit
- Optional water bill and other charges

These settings should remain unchanged every month unless I manually edit them.

### 2. Monthly Bill Entry
Create a simple form with:
- Billing month and year
- Previous electricity meter reading
- Current electricity meter reading
- House rent (automatically filled from settings)
- Gas bill (automatically filled from settings)
- Water bill
- Other charges
- Previous due, if any
- Discount, if any

Automatically calculate:

Consumed Units = Current Reading - Previous Reading

Electricity Bill = Consumed Units × Electricity Rate

Total Bill = House Rent + Electricity Bill + Gas Bill + Water Bill + Other Charges + Previous Due - Discount

Show the total immediately when I enter the readings.

Automatically use the previous month's closing meter reading as the next month's opening reading. Allow manual correction when necessary.

### 3. Save Monthly Records
Every month, save the following information permanently in a database:
- Billing month
- Previous and current meter readings
- Electricity units consumed
- Electricity rate and electricity bill
- House rent and all additional charges
- Total bill
- Amount paid
- Remaining due
- Bill creation date

Prevent duplicate bills for the same month unless I explicitly edit an existing record.

Use Supabase as the database so data remains saved after closing or refreshing the browser.

### 4. Generate Receipt
Add one prominent button: **Generate Receipt**.

Create a professional, printable receipt containing:
- House/tenant information
- Bill number
- Billing month and year
- Previous meter reading
- Current meter reading
- Units consumed
- Electricity rate per unit
- Itemized house rent and utility charges
- Previous due and discount
- Total payable
- Amount paid and remaining due
- Payment status

Provide buttons to:
- Download PDF
- Print receipt
- Save bill

Use Bangladeshi Taka (৳) and support Bangla text in the receipt if practical.

### 5. Monthly History
Show a simple table of all saved monthly bills.

Columns:
Month | Previous Reading | Current Reading | Units | Electricity Bill | House Rent | Total Bill | Paid | Due | Actions

Actions:
- View receipt
- Download PDF
- Edit record
- Record payment

Allow filtering by month and year.

### 6. Simple Dashboard
Display only:
- Current month's total bill
- Current month's electricity consumption
- Total outstanding due
- Latest saved bill

Include two main buttons:
- Add Monthly Bill
- View Bill History

### 7. Design
- Minimal and easy-to-use interface
- White background with soft blue accents
- Responsive desktop and mobile design
- Large, clear input fields
- No unnecessary pages, complex charts, tenant management, or property management features

### 8. Technical Requirements
- React + TypeScript
- Tailwind CSS
- Supabase PostgreSQL for permanent storage
- Secure database access and appropriate RLS policies
- Reliable PDF generation and printing
- Validate that current meter reading is not lower than the previous reading
- Prevent accidental duplicate bills
- Use real saved data, not mock data
- No hardcoded passwords or exposed secret keys

Build the complete working app, not just a visual prototype. Connect the form, calculations, database, history, and receipt generator. If Supabase configuration is required, explain exactly how to connect it.

Keep the app as simple as possible: one fixed house, one fixed rent configuration, monthly electricity readings, automatic bill calculation, permanent data storage, and one-click receipt generation.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://bill01.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8e3dba3a-857e-4a1f-b194-9ad1f5e3aa17).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
