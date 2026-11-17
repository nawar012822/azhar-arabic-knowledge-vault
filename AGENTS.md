<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Repository records use Dublin Core field names (see src/data/repository.ts) so they can be exported to DSpace later.
- Download permission goes through `canDownload(access, signedIn)`; never expose files for `metadata` access.
- UI is Arabic RTL (`dir="rtl"` on <html>); use logical spacing (ps/pe, text-start).
- Load item detail records client-side through the shared query cache so owner/staff visibility uses the current authenticated session.
- Deliver private files as permission-scoped cached Blobs; download clicks stay synchronous for mobile and PDF rendering imports its matching worker dynamically.
- Enforce last-administrator protection in a database trigger as well as the UI so direct and concurrent requests cannot bypass handover safety.
- Cache role reads by user ID and invalidate them after role changes so account navigation reflects current permissions.

- Use the shared ItemForm for deposits and edits; member edits preserve ownership and return pending/revision records to review, while staff edits retain status.
- Contact messages require a signed-in sender and are persisted with sender/admin-only read access; only admins may change message status.
