"use client";

import { useState, useEffect } from "react";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "@/lib/contexts/session-context";
import { User, Mail, Lock, Shield, Loader2, CheckCircle } from "lucide-react";

export default function ProfilePage() {
  const { user, checkSession } = useSession();
  const { toast } = useToast();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // ✅ UPDATE PROFILE
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    setIsSavingProfile(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/auth/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to update profile");

      await checkSession();

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ✅ UPDATE PASSWORD
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "All password fields are required", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setIsSavingPassword(true);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/auth/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to update password");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="min-h-screen bg-background">
      <Container className="pt-24 pb-10 max-w-2xl">

        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user?.name || "Your Profile"}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-6">

          {/* PROFILE */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-4 h-4 text-primary" /> Personal Information
              </CardTitle>
              <CardDescription>Update your name and email address</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">

                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <Button type="submit" disabled={isSavingProfile}>
                  {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle />}
                  Save Changes
                </Button>

              </form>
            </CardContent>
          </Card>

          {/* PASSWORD */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="w-4 h-4 text-primary" /> Change Password
              </CardTitle>
              <CardDescription>Keep your account secure</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">

                <Input
                  type="password"
                  placeholder="Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />

                <Input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />

                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <Button type="submit" variant="outline" disabled={isSavingPassword}>
                  {isSavingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield />}
                  Update Password
                </Button>

              </form>
            </CardContent>
          </Card>

        </div>
      </Container>
    </div>
  );
}