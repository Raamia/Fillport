import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-muted/40 to-background">
      <div className="z-10 w-full max-w-5xl items-center justify-center text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl mb-6">
          Stop Repeating Yourself on Forms.
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
          Fillport is your secure hub for personal information. Fill out common
          government and administrative forms with a single click, just like the
          Common App, but for paperwork.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button size="lg">Get Started</Button>
          {/* We can add a "Learn More" button later if needed */}
          {/* <Button variant="outline" size="lg">Learn More</Button> */}
        </div>
      </div>
      {/* Optional: Add a subtle background element or graphic later */}
    </main>
  );
}
