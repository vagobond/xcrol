import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ContentPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <Helmet>
        <title>Content Policy – XCROL</title>
        <meta name="description" content="XCROL content policy outlining community standards and rules." />
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <h1 className="text-3xl md:text-4xl font-bold">Content Policy</h1>
        <p className="text-muted-foreground">
          To maintain a safe and respectful community, users must follow these rules when posting or interacting on the platform.
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. No Hate Speech or Harassment</h2>
          <p className="text-muted-foreground leading-relaxed">
            Content that promotes violence, discrimination, or hatred against individuals or groups based on characteristics such as race, ethnicity, nationality, religion, gender, sexual orientation, disability, or similar attributes is strictly prohibited. Harassment, threats, or bullying of any user is not allowed.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. No Illegal Activity</h2>
          <p className="text-muted-foreground leading-relaxed">
            Users may not post, promote, or facilitate illegal activities. This includes sharing instructions, coordinating unlawful acts, selling illegal goods or services, or encouraging others to break the law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Zero Tolerance for Child Abuse or Exploitation</h2>
          <p className="text-muted-foreground leading-relaxed">
            Any content that involves child abuse, sexualization of minors, grooming behavior, or exploitation of children is strictly forbidden. This includes images, videos, messages, links, or any other material involving minors in abusive or exploitative contexts.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Reporting and Enforcement</h2>
          <p className="text-muted-foreground leading-relaxed">
            Users are encouraged to report violations. Content that violates these rules may be removed, and accounts may be suspended or permanently banned. Serious violations may be reported to law enforcement.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Platform Responsibility</h2>
          <p className="text-muted-foreground leading-relaxed">
            We reserve the right to review, remove, or restrict any content or account that violates this policy or threatens the safety of the community.
          </p>
        </section>
      </div>
    </div>
  );
};

export default ContentPolicy;
