export const adminChangeAccountStatus = (fullname, { account_number, oldStatus, newStatus, created_date }, logId) => [
  `# Hello ${fullname},`,
  '',
  `## Your account (${account_number}) have been changed status from ${oldStatus} to ${newStatus} at ${created_date}`,
  `### Log ID: ${logId}`,
  '### If you think this is a mistake, please contact to our support and send us your Log ID for more information.',
  '----------',
  '**PIGGY BANK**',
].join('\n');
