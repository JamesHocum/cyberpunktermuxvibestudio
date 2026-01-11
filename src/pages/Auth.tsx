import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Terminal, Lock, Mail, AlertCircle } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading, signIn, signUp } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Redirect authenticated users to main page
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const validateForm = () => {
    try {
      authSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'email') fieldErrors.email = err.message;
          if (err.path[0] === 'password') fieldErrors.password = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const { error } = await signIn(email, password);
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Sign In Failed',
        description: error.message === 'Invalid login credentials' 
          ? 'Invalid email or password. Please try again.' 
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome Back!',
        description: 'You have successfully signed in.',
      });
      navigate('/', { replace: true });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const { data, error } = await signUp(email, password);
    setIsSubmitting(false);

    if (error) {
      const message = error.message.includes('already registered')
        ? 'This email is already registered. Please sign in instead.'
        : error.message;
      
      toast({
        title: 'Sign Up Failed',
        description: message,
        variant: 'destructive',
      });
    } else if (data.user) {
      toast({
        title: 'Account Created!',
        description: 'You can now sign in with your credentials.',
      });
      navigate('/', { replace: true });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-studio-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-studio-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20" />
      
      <Card className="w-full max-w-md relative z-10 bg-black/80 border-purple-600/30 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 shadow-[0_0_30px_rgba(168,85,247,0.5)]">
              <Terminal className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            CYBERPUNK TERMUX
          </CardTitle>
          <CardDescription className="text-gray-400">
            Enter the matrix. Build the future.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-black/50 border border-purple-600/30">
              <TabsTrigger value="signin" className="data-[state=active]:bg-purple-600/30">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-cyan-600/30">
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-gray-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="agent@matrix.io"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-black/50 border-purple-600/30 focus:border-purple-500"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.email}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-gray-300">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-black/50 border-purple-600/30 focus:border-purple-500"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.password}
                    </p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Accessing...
                    </>
                  ) : (
                    'Enter the Matrix'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-gray-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="agent@matrix.io"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-black/50 border-cyan-600/30 focus:border-cyan-500"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.email}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-gray-300">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-black/50 border-cyan-600/30 focus:border-cyan-500"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.password}
                    </p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Agent...
                    </>
                  ) : (
                    'Create Agent'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
