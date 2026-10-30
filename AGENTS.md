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
- Public visitors can read the dashboard, bill history, receipts and settings. Adding/editing bills and recording payments require a signed-in account whose `profiles.status` is `approved`; changing settings and approving accounts are owner-only.
- Account state lives in `public.profiles` (`role`: owner/member, `status`: pending/approved/rejected). New auth users are created by the `handle_new_user` trigger, the first account becomes owner, and the owner-only `review_account` RPC approves/rejects later sign-ups. Run `supabase/migrations/20261030000000_account_approval.sql` against the Supabase project; public read policies stay in place while bill writes use `is_approved()` and settings writes use `is_owner()`.
- No login is needed for public history and receipts, but writes use Supabase Auth + RLS. Keep `src/start.ts` free of session-attaching function middleware; the browser client carries the session and the database enforces access.
- Bills and settings still use the fixed singleton `user_id` (`SINGLETON_ID` in `src/lib/data.ts`) so the one-bill-per-month constraint keeps working.
