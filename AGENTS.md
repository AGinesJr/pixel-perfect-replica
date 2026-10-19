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

- Candidate progress lives in browser localStorage (src/lib/progress.ts) until accounts are added; why: v1 demo without login.
- AI recruiter/interview calls run only in server functions in src/lib/ai.functions.ts; why: keeps the AI key server-side.
