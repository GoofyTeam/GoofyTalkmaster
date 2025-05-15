import SpeakerCard from "@/components/custom/SpeakerCard";
import { CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { API_BASE_URL } from "@/lib/utils";
import { useLoaderData, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

const SpeakerRequest = () => {
  const router = useRouter();
  const { requests, numberOfRequests } = useLoaderData({
    from: "/manage/speaker-request",
  });

  const onValidate = async (requestId: string) => {
    console.log("Validate request with ID:", requestId);

    try {
      await fetch(`${API_BASE_URL}/api/sanctum/csrf-cookie`, {
        credentials: "include",
      });

      const csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="))
        ?.split("=")[1];

      if (!csrfToken) {
        throw new Error("CSRF token not found");
      }

      ///api/speakers-request/{id}/approve
      const validateResponse = await fetch(
        `${API_BASE_URL}/api/speakers-request/${requestId}/approve`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-XSRF-TOKEN": decodeURIComponent(csrfToken),
          },
          credentials: "include",
          body: JSON.stringify({}),
        },
      );

      if (!validateResponse.ok) {
        const errorData = await validateResponse.json();
        toast("Erreur lors de la validation de la demande");
        throw new Error(errorData.message || "Error validating request");
      }

      const data = await validateResponse.json();
      if (data.success) {
        console.log("Request validated successfully:", data);
      }
      toast("Demande validée avec succès");
      router.invalidate();
    } catch (error) {
      console.error("Error validating request:", error);
    }
  };

  const onReject = async (requestId: string) => {
    console.log("Reject request with ID:", requestId);

    try {
      await fetch(`${API_BASE_URL}/api/sanctum/csrf-cookie`, {
        credentials: "include",
      });

      const csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="))
        ?.split("=")[1];

      if (!csrfToken) {
        throw new Error("CSRF token not found");
      }

      const validateResponse = await fetch(
        `${API_BASE_URL}/api/speakers-request/${requestId}/refuse`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-XSRF-TOKEN": decodeURIComponent(csrfToken),
          },
          credentials: "include",
          body: JSON.stringify({}),
        },
      );

      if (!validateResponse.ok) {
        const errorData = await validateResponse.json();
        toast("Erreur lors de la validation de la demande");
        throw new Error(errorData.message || "Error validating request");
      }

      const data = await validateResponse.json();
      if (data.success) {
        console.log("Request validated successfully:", data);
      }
      toast("Demande refusée avec succès");
      router.invalidate();
    } catch (error) {
      console.error("Error validating request:", error);
    }
  };

  return (
    <div className="flex gap-4 p-4 md:flex-row flex-col">
      <div className="flex-1 md:w-1/2">
        <h1 className="text-2xl font-bold mb-4">Demandes de promotions</h1>
        <p className="text-gray-600 mb-4">
          Ici, vous pouvez gérer les demandes à devenir conférencier.
        </p>
        <p className="text-gray-600 mb-4">
          Nombre de demandes: {numberOfRequests}
        </p>
      </div>
      <Separator
        orientation="vertical"
        className="!h-[90vh] sticky hidden md:block"
      />
      <div className="flex-1 md:w-1/2">
        <CardContent>
          {requests.map((request) => (
            <SpeakerCard
              key={request.id}
              name={`${request.user?.first_name}`}
              phoneNumber={request.phone}
              description={request.description}
              onCancel={() => onReject(request.id)}
              onPromote={() => onValidate(request.id)}
            />
          ))}
        </CardContent>
      </div>
    </div>
  );
};

export default SpeakerRequest;
