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
- No login: routes live under the public pathless layout src/routes/_app/; tables have public anon policies and rows share a fixed singleton user_id (SINGLETON_ID in src/lib/data.ts) so the one-bill-per-month constraint still works.
- Keep src/start.ts free of session-attaching function middleware because the app has no authenticated actions; retain error handling and CSRF protection.
