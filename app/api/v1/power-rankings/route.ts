export async function GET() {
  return Response.json({ data: [], meta: { methodology: "form:35,opponent:25,map:20,roster:10,schedule:10", demo: false, available: false, reason: "insufficient_licensed_samples" } });
}
