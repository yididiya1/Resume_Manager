import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export default function Home() {
  return (
    <main className="landing-gradient min-h-dvh px-6 py-16">
      <div className="mx-auto max-w-6xl space-y-16">
        {/* Hero */}
        <section className="grid items-center gap-10 md:grid-cols-2">
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Build once. Tailor fast. Apply smarter.</h1>
              <p className="max-w-xl text-muted-foreground">
                Store reusable resume content (education, experience, projects, skills), tailor it to any job description in minutes, and
                export clean ATS-friendly PDFs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild>
                <Link href="/login">Get started</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/app">Open dashboard</Link>
              </Button>
              <div className="w-full text-xs text-muted-foreground">No clutter • Reusable content • PDF-ready</div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border bg-background p-3">
                <div className="text-sm font-medium">Reusable library</div>
                <div className="text-xs text-muted-foreground">Save bullets once, reuse everywhere</div>
              </div>
              <div className="rounded-lg border bg-background p-3">
                <div className="text-sm font-medium">Job tailoring</div>
                <div className="text-xs text-muted-foreground">Match language to the job description</div>
              </div>
              <div className="rounded-lg border bg-background p-3">
                <div className="text-sm font-medium">Clean export</div>
                <div className="text-xs text-muted-foreground">Consistent formatting, ATS-friendly PDF</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/10 p-4">
            <div className="overflow-hidden rounded-lg border bg-background">
              <Image
                src="/landing-preview.svg"
                alt="Two-pane editor with live PDF preview"
                width={1200}
                height={800}
                priority
              />
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Two-pane builder with live PDF preview. Edit content on the left → see the final resume on the right.
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">A better workflow than rewriting every time</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">Save content once → tailor with a JD → export & track versions.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">1) Build your library</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Add your experience, projects, skills, and achievements as structured entries.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">2) Tailor to a job</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Select a job description, pick relevant entries, and generate a targeted resume version.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">3) Export and reuse</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Download PDF, keep versions, and update your library once—every resume improves.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pillars */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">Three pillars</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resume Builder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div>Two-pane editor + live PDF preview</div>
                <div>Section editing with rich text bullets</div>
                <div>Export PDF anytime</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resume Adjuster</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div>Paste a job description and tailor content</div>
                <div>Keyword matching + targeted versions</div>
                <div>Optimization workflow (suggestions, not overwrite)</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Content Library</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div>Store entries once (education, experience, projects, skills)</div>
                <div>Reuse across resumes and cover letters</div>
                <div>Keep your “master” bullets consistent</div>
              </CardContent>
            </Card>
          </div>
          <div className="text-sm text-muted-foreground">Built for grad students, career switchers, and engineers. Tailor in minutes.</div>
        </section>

        {/* Use cases */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">Made for people who juggle multiple roles</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-background p-4">
              <div className="font-medium">SWE + Data Science applicants</div>
              <div className="mt-1 text-sm text-muted-foreground">Choose different emphasis per job description.</div>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="font-medium">Career switchers</div>
              <div className="mt-1 text-sm text-muted-foreground">Keep one library, create targeted versions.</div>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="font-medium">Internship season</div>
              <div className="mt-1 text-sm text-muted-foreground">Fast tailoring without losing consistency.</div>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="font-medium">Project-heavy profiles</div>
              <div className="mt-1 text-sm text-muted-foreground">Clean structure + reusable project bullets.</div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="ats">
              <AccordionTrigger>Is it ATS-friendly?</AccordionTrigger>
              <AccordionContent>Yes—exports clean, readable PDFs with consistent structure.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="rewrite">
              <AccordionTrigger>Do you rewrite my resume completely?</AccordionTrigger>
              <AccordionContent>
                No. You control what gets included. The Adjuster suggests improvements without changing your story.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="versions">
              <AccordionTrigger>Can I keep multiple resume versions?</AccordionTrigger>
              <AccordionContent>Yes—create versions per role, company, or job post.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="privacy">
              <AccordionTrigger>Is my data private?</AccordionTrigger>
              <AccordionContent>Your content is stored securely, and you control exports and deletions.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Final CTA */}
        <section className="rounded-xl border bg-muted/10 p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-2">
              <div className="text-2xl font-semibold tracking-tight">Stop rewriting. Start reusing.</div>
              <div className="text-sm text-muted-foreground">
                Build your master library today and tailor resumes in minutes.
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/login">Get started</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/app">Open dashboard</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
