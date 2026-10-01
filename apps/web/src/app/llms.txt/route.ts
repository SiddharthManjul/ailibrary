const content = `# AI Library

> Production-ready workflows, agents and UI components running standalone & packaged as kits for every team.

## Landing page

- [AI Library](/): Product overview and interactive demonstrations.
- [Kits](/#kits): Sales, Support, Marketing, Engineering and Operations previews.
- [Workflows](/#workflows): Workflow platform previews and example runs.
- [Agents](/#agents): Agent forms, autonomy and approval demonstrations.
- [UI](/#ui): Interactive component and block previews.
- [Install](/#install): Example installation approaches.
- [Test results](/#tested): Clearly labelled sample results.
- [Free items](/#free): Free-item previews and example commands.
- [Pricing](/#pricing): Sample plans and seat options.
- [Studio](/#studio): Implementation service overview.
- [FAQ](/#faq): Product questions and answers.

## Availability

This deployment contains only the marketing landing page. Catalog details,
documentation, registry, downloads, checkout and account delivery are not yet
published. Demonstrations use fictional seed data; prices, commands and test
results are previews, not live delivery services or measured production claims.
`;

export function GET() {
  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
  });
}
