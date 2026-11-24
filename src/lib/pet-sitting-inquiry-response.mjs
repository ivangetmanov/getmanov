export async function isAcceptedPetSittingEnquiryResponse(response) {
  if (!response || response.ok !== true || typeof response.json !== "function") return false;

  try {
    const result = await response.json();
    return result?.ok === true && result?.accepted === true;
  } catch {
    return false;
  }
}

export async function trackAcceptedPetSittingEnquiry(response, track, eventName, parameters) {
  if (!await isAcceptedPetSittingEnquiryResponse(response)) return false;

  try {
    if (typeof track === "function") track(eventName, parameters);
  } catch {
    // Analytics failures must not change a confirmed enquiry's user-facing result.
  }

  return true;
}
