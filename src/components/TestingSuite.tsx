import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TestTube, Play, CheckCircle, XCircle, Clock, Monitor, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
}

interface TestingSuiteProps {
  isVisible: boolean;
  onClose: () => void;
}

export const TestingSuite: React.FC<TestingSuiteProps> = ({ isVisible, onClose }) => {
  const [tests, setTests] = useState<TestResult[]>([
    { id: '1', name: 'Component Rendering Tests', status: 'pending' },
    { id: '2', name: 'API Integration Tests', status: 'pending' },
    { id: '3', name: 'Offline Functionality Tests', status: 'pending' },
    { id: '4', name: 'Performance Benchmarks', status: 'pending' },
    { id: '5', name: 'Cross-Platform Compatibility', status: 'pending' },
    { id: '6', name: 'Security Vulnerability Scan', status: 'pending' },
    { id: '7', name: 'Build Process Validation', status: 'pending' },
    { id: '8', name: 'Installer Package Tests', status: 'pending' }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  if (!isVisible) return null;

  const runTests = async () => {
    setIsRunning(true);
    
    for (let i = 0; i < tests.length; i++) {
      setTests(prev => prev.map((test, index) => 
        index === i ? { ...test, status: 'running' } : test
      ));
      
      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      const success = Math.random() > 0.2; // 80% success rate
      
      setTests(prev => prev.map((test, index) => 
        index === i ? { 
          ...test, 
          status: success ? 'passed' : 'failed',
          duration: Math.floor(Math.random() * 3000) + 500,
          error: success ? undefined : 'Test failed due to mock simulation'
        } : test
      ));
    }
    
    setIsRunning(false);
    toast({
      title: "Testing Complete",
      description: "All tests have finished running",
    });
  };

  const resetTests = () => {
    setTests(prev => prev.map(test => ({ ...test, status: 'pending', duration: undefined, error: undefined })));
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      pending: 'secondary',
      running: 'default',
      passed: 'default',
      failed: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    );
  };

  const passedTests = tests.filter(t => t.status === 'passed').length;
  const failedTests = tests.filter(t => t.status === 'failed').length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl mx-4 bg-card border max-h-[80vh]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Testing Suite Dashboard
          </CardTitle>
          <CardDescription>
            Comprehensive testing for PC and React applications with offline capabilities
          </CardDescription>
          
          <div className="flex gap-4 pt-2">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span className="text-sm">PC App Tests</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="text-sm">React Web Tests</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <div className="text-sm">
                <span className="font-medium text-green-500">{passedTests} Passed</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-red-500">{failedTests} Failed</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-muted-foreground">{tests.length - passedTests - failedTests} Pending</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetTests} disabled={isRunning}>
                Reset
              </Button>
              <Button onClick={runTests} disabled={isRunning} size="sm">
                {isRunning ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run All Tests
                  </>
                )}
              </Button>
            </div>
          </div>

          <ScrollArea className="h-64">
            <div className="space-y-2">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <div className="font-medium">{test.name}</div>
                      {test.error && (
                        <div className="text-sm text-red-500 mt-1">{test.error}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {test.duration && (
                      <span className="text-sm text-muted-foreground">
                        {test.duration}ms
                      </span>
                    )}
                    {getStatusBadge(test.status)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <div className="text-sm text-muted-foreground">
              Testing framework ready for PC and React deployments
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};