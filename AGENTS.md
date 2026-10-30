<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Bill math lives in src/lib/bill.ts (calculateBill) and is covered by src/lib/bill.test.ts; keep the form, history and receipt using it so totals stay consistent.
- New and edited bills use the fixed-rent calculation; retain legacy charge columns with zero writes for compatibility, and preserve untouched historical totals.
- Derive nonnegative due and extra paid from total and amount paid through paymentBalance for all payment displays and updates; extra paid requires no separate stored column.
- Only bill history is public. The dashboard, receipts, add/edit bills, payments and settings all require a signed-in account; bills need `profiles.status = 'approved'`, while settings and account approval are owner-only.
- Account state lives in `public.profiles` (`role`: owner/member, `status`: pending/approved/rejected). New auth users are created by the `handle_new_user` trigger; `heynazmulhossain@gmail.com` is the hard-coded admin and always becomes the owner, while every other sign-up is pending until the owner uses the `review_account` RPC. Run `supabase/migrations/20261030000000_account_approval.sql` against the Supabase project; public read policies stay in place while bill writes use `is_approved()` and settings writes use `is_owner()`.
- Receipts and print/PDF output are Bangla-only (`src/lib/bangla.ts` + `src/components/Receipt.tsx`); keep new receipt labels Bangla and use `takaBn` / `dateLabelBn` rather than the English `taka` helper.
- Logged-out visitors see only the bill history page. Everything else is gated in the UI by `AuthGate`, and writes are additionally enforced by Supabase Auth + RLS. Keep `src/start.ts` free of session-attaching function middleware; the browser client carries the session and the database enforces access.
- Bills and settings still use the fixed singleton `user_id` (`SINGLETON_ID` in `src/lib/data.ts`) so the one-bill-per-month constraint keeps working.
