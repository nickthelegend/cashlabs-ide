import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play } from 'lucide-react';
import { GitHubLogin } from "@/components/github-login";
import { ProjectsList } from "@/components/projects-list";

export default function HomePage() {
  const templates = [
    { name: "CashScript", description: "Standard Smart Contracts for Bitcoin Cash", link: "/tealscript" },
    { name: "Mainnet-js", description: "Node.js SDK for Bitcoin Cash applications", link: "/puyapy" },
    { name: "Libauth", description: "Low-level cryptographic library for Bitcoin Cash", link: "/puyats" },
    { name: "Advanced CashScript", description: "Complex Smart Contracts & Covenants", link: "/pyteal" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "var(--background-color)", color: "var(--text-color)" }}>
      <div className="absolute top-4 right-4">
        <GitHubLogin />
      </div>
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex items-center justify-center space-x-1">
          <Image
            src="/logo.png"
            alt="Algorand IDE Logo"
            width={80}
            height={80}
            className="object-contain p-2"
          />
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            CashLabs
          </h1>
        </div>
        <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
          Choose a template to start building your Bitcoin Cash Smart Contract.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-8">
        {templates.map((template) => (
          <Card key={template.name} className="flex flex-col justify-between" style={{ backgroundColor: "var(--sidebar-color)", borderColor: "var(--border-color)" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {template.name}
              </CardTitle>
              <CardDescription>
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={template.link} passHref>
                <Button
                  className="w-full"
                  style={{ backgroundColor: "var(--button-color)", color: "var(--text-color)" }}
                >
                  Start Building
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
        <Card className="flex flex-col justify-between col-span-full sm:col-span-2 lg:col-span-1 self-end hover:scale-105 transition-transform duration-300 ease-in-out shadow-lg shadow-green-500/50" style={{ backgroundColor: "var(--sidebar-color)", borderColor: "var(--border-color)" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              My Projects
            </CardTitle>
            <CardDescription>View and manage your saved projects</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/projects" passHref>
              <Button className="w-full" style={{ backgroundColor: "var(--button-color)", color: "var(--text-color)" }}>
                View Projects
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="flex flex-col justify-between col-span-full sm:col-span-2 lg:col-span-1 self-end hover:scale-105 transition-transform duration-300 ease-in-out shadow-lg shadow-blue-500/50" style={{ backgroundColor: "var(--sidebar-color)", borderColor: "var(--border-color)" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Playground
            </CardTitle>
            <CardDescription>Explore public projects from the community</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/playground" passHref>
              <Button className="w-full" style={{ backgroundColor: "var(--button-color)", color: "var(--text-color)" }}>
                Explore Playground
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="flex flex-col justify-between col-span-full sm:col-span-2 lg:col-span-1 self-end hover:scale-105 transition-transform duration-300 ease-in-out shadow-lg shadow-blue-500/50" style={{ backgroundColor: "var(--sidebar-color)", borderColor: "var(--border-color)" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              CashFlow
            </CardTitle>
            <CardDescription>Drag and drop to create transactions in Python, JavaScript etc. and also create smart contracts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/build" passHref>
              <Button className="w-full" style={{ backgroundColor: "var(--button-color)", color: "var(--text-color)" }}>
                Start Building
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
