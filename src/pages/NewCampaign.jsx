import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, ArrowRight, CheckCircle, Rocket } from 'lucide-react';

const steps = ["Setup", "Audience", "Message", "Scheduling", "Review"];

const NewCampaign = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    const launchCampaign = () => {
        toast({
            title: '🚀 Campaign Launched!',
            description: 'Your new campaign is on its way to your audience.',
            className: 'bg-green-500 text-white',
        });
        setTimeout(() => navigate('/campaigns'), 1500);
    };

    const showToast = () => {
        toast({
            title: '🚧 Feature Not Implemented',
            description: "You can request this feature in the next prompt! 🚀",
        });
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Setup
                return (
                    <div className="space-y-4">
                        <Label htmlFor="campaign-name">Campaign Name</Label>
                        <Input id="campaign-name" placeholder="e.g., Q4 Product Launch" />
                    </div>
                );
            case 1: // Audience
                return (
                    <div className="space-y-4">
                        <Label>Select Audience List</Label>
                        <Select onValueChange={showToast}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a list..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Premium Customers Q3 (1250 contacts)</SelectItem>
                                <SelectItem value="2">New Signups - June (840 contacts)</SelectItem>
                                <SelectItem value="3">Black Friday Waitlist (5400 contacts)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">Total unique contacts selected: <span className="font-bold text-primary">1250</span></p>
                    </div>
                );
            case 2: // Message
                return (
                    <div className="space-y-4">
                        <Label>Select Message Template</Label>
                         <Select onValueChange={showToast}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a template..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">welcome_promo_v2</SelectItem>
                                <SelectItem value="2">shipping_update</SelectItem>
                                <SelectItem value="3">abandoned_cart_reminder</SelectItem>
                            </SelectContent>
                        </Select>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Template Preview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm italic text-muted-foreground">"Hello [Full Name]! Welcome to our service. Enjoy a 20% discount..."</p>
                            </CardContent>
                        </Card>
                    </div>
                );
            case 3: // Scheduling
                return (
                    <div className="space-y-6">
                        <div>
                            <Label>Scheduling Options</Label>
                            <div className="flex gap-4 mt-2">
                                <Button variant="outline" onClick={showToast}>Send Immediately</Button>
                                <Button variant="outline" onClick={showToast}>Schedule for Later</Button>
                            </div>
                        </div>
                        <div>
                            <Label>Time Interval Between Messages</Label>
                            <Select onValueChange={showToast}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select throttling speed..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="slow">Slow (1 message / 60-90s)</SelectItem>
                                    <SelectItem value="medium">Medium (1 message / 30-60s)</SelectItem>
                                    <SelectItem value="fast">Fast (1 message / 5-10s)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                );
            case 4: // Review
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Review Campaign Details</h3>
                        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                            <li><span className="font-semibold text-foreground">Name:</span> Q4 Product Launch</li>
                            <li><span className="font-semibold text-foreground">Audience:</span> Premium Customers Q3 (1250 contacts)</li>
                            <li><span className="font-semibold text-foreground">Message:</span> welcome_promo_v2</li>
                            <li><span className="font-semibold text-foreground">Schedule:</span> Immediately</li>
                        </ul>
                        <div className="border-t pt-4">
                            <p className="text-sm">Your campaign is ready. Once launched, it will be sent to 1250 contacts.</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Helmet>
                <title>New Campaign | LeadFlow</title>
                <meta name="description" content="Create a new messaging campaign." />
            </Helmet>
            <div className="space-y-6 max-w-2xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold">Create New Campaign</h1>
                    <p className="text-muted-foreground">Follow the steps to launch your campaign.</p>
                </div>
                
                <div className="flex justify-between mb-4">
                    {steps.map((step, index) => (
                        <div key={step} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                {index < currentStep ? <CheckCircle className="h-5 w-5" /> : index + 1}
                            </div>
                            <p className={`ml-2 ${index <= currentStep ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>{step}</p>
                        </div>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{steps[currentStep]}</CardTitle>
                        <CardDescription>Step {currentStep + 1} of {steps.length}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderStepContent()}
                    </CardContent>
                </Card>

                <div className="flex justify-between">
                    <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    {currentStep < steps.length - 1 ? (
                        <Button onClick={handleNext}>
                            Next <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={launchCampaign} className="bg-green-600 hover:bg-green-700">
                            <Rocket className="mr-2 h-4 w-4" /> Launch Campaign
                        </Button>
                    )}
                </div>
            </div>
        </>
    );
};

export default NewCampaign;