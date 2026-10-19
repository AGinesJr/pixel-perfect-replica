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

- Candidate progress remains browser-local for guests and syncs through the existing account integration when signed in; why: preserve guest practice and cross-device progress.
- AI recruiter/interview calls run only in server functions in src/lib/ai.functions.ts; why: keeps the AI key server-side.
- Load the ElevenLabs interview component dynamically behind ClientOnly; why: its browser SDK must not enter SSR evaluation.
- Request live voice tokens from the existing authenticated elevenlabs-session endpoint and send only job context; why: reuse the deployed token service without exposing its secret.
- Generate the app worker with vite-plugin-pwa into dist/client and register only through src/lib/pwa.ts; why: prevent preview workers and cache only public hashed styling/media, never documents or private responses.
