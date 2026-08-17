import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Balancer } from 'react-wrap-balancer';

/**
 * A static page displaying the website's policies, including Terms of Service,
 * Privacy Policy, and a "No Refund" policy.
 * @returns {React.ReactElement} The policies page component.
 */
export default function PoliciesPage() {
    return (
        <div className="bg-secondary py-16 md:py-24">
            <div className="container mx-auto max-w-4xl">
                <header className="text-center mb-12">
                    <h1 className="text-4xl font-headline font-bold"><Balancer>Our Policies</Balancer></h1>
                    <p className="text-muted-foreground mt-2"><Balancer>Terms, Privacy, and Refunds</Balancer></p>
                </header>

                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Terms of Service</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-sm md:prose-base max-w-none dark:prose-invert text-muted-foreground space-y-4">
                            <p>
                                By accessing and using our website and services, you agree to comply with and be bound by the following terms and conditions. These terms apply to all visitors, users, and others who wish to access or use the Service.
                            </p>
                            <p>
                                The information and guidance provided are for informational purposes only and are not a substitute for professional medical advice. You are responsible for your own health decisions. The content on this site is our property and may not be reproduced without permission.
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Privacy Policy</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-sm md:prose-base max-w-none dark:prose-invert text-muted-foreground space-y-4">
                            <p>
                                We are committed to protecting your privacy. We collect personal information such as your name, email, and health data solely for the purpose of providing personalized nutrition consulting services. We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties.
                            </p>
                             <p>
                                Your data is stored securely, and we implement a variety of security measures to maintain the safety of your personal information.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-primary bg-primary/5">
                        <CardHeader>
                            <CardTitle>No Refund Policy</CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-sm md:prose-base max-w-none dark:prose-invert text-muted-foreground space-y-4">
                            <p>
                                Due to the personalized nature of our nutrition plans and consulting services, all sales are final. We invest significant time and expertise in crafting a plan that is unique to you.
                            </p>
                             <p>
                                **We do not offer refunds on any of our nutrition plans or services once the purchase is complete.** We are committed to your success and will work with you to ensure you are satisfied with the guidance provided. If you have any concerns about your plan, please contact us to discuss how we can better support you on your health journey.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
