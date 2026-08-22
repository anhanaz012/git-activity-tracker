#!/usr/bin/env node
import { writeFileSync } from "fs";
import process from "process";
const username = process.argv[2];
const extractRef = (ref) => {
  let result;
  if (ref) {
    result = ref.split("/");
    return result[result.length - 1];
  } else {
    result = "";
  }
  return result;
};
extractRef("refs/heads/development");
const formatActivityType = (type, payload) => {
  switch (type) {
    case "PushEvent":
      return `Pushed changes to ${payload.branch} in ${payload.repo} at ${payload.created_at}`;
    case "CommitCommentEvent":
      return `Commented on commit in ${payload.repo} at ${payload.created_at}`;
    case "CreateEvent":
      return payload.refType == "repository"
        ? `Created repository ${payload.repo} at ${payload.created_at}`
        : `Created ${payload.refType} ${payload.ref} in ${payload.repo} at ${payload.created_at} `;
    case "DeleteEvent":
      return `Deleted ${payload.refType} ${payload.ref} in ${payload.repo} at ${payload.created_at}`;
    case "DiscussionEvent":
      return `Started discussion #${payload.number} as ${payload.title} at ${payload.created_at} `;
    case "ForkEvent":
      return `Forked ${payload.sourceRepo} to ${payload.forkee}`;
    case "GollumEvent":
      return `${payload.action} page ${payload.pageName} in ${payload.repo} at ${payload.created_at}`;
    case "IssueCommentEvent":
      return payload.pullRequest
        ? `Commented on pull request #${payload.prNo} at ${payload.created_at}`
        : `Commented on issue #${payload.issueNo} at ${payload.created_at}`;
    case "IssuesEvent":
      return formatIssueEvent(payload.action, payload);
    case "PullRequestEvent":
      return formatPullRequestEvent(payload.action, payload);
    case "MemberEvent":
      return payload.action == "edited"
        ? `Updated ${payload.member.login}'s repository access in ${payload.repo} at ${payload.created_at}`
        : `Was ${payload.action} as a collaborator in ${payload.repo} at ${payload.created_at}`;
    case "PublicEvent":
      return `made repo ${payload.repo} as public`;
    case "PullRequestReviewEvent":
      return `${payload.action} review on PR #${payload.prNo} in ${payload.repo} at ${payload.created_at}`;
    case "PullRequestReviewCommentEvent":
      return `Commented on PR #${payload.prNo} in ${payload.repo} at ${payload.created_at}`;
    case "ReleaseEvent":
      return `${payload.action} release ${payload.tagName} in ${payload.repo} at ${payload.created_at}`;
    case "WatchEvent":
      return `Starred ${payload.repo} at ${payload.created_at}`;
  }
};
const formatDate = (date) => {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};
const formatPayload = (type, data) => {
  const created_at = formatDate(new Date(data.created_at));
  switch (type) {
    case "PushEvent":
      return {
        branch: extractRef(data.payload.ref),
        repo: data.repo.name,
        created_at,
      };
    case "CommitCommentEvent":
      return {
        repo: data.repo.name,
        created_at,
      };
    case "CreateEvent":
      return {
        refType: data.payload.ref_type,
        ref: extractRef(data.payload.full_ref),
        repo: data.repo.name,
        created_at,
      };
    case "DeleteEvent":
      return {
        refType: data.payload.ref_type,
        ref: extractRef(data.payload.full_ref),
        repo: data.repo.name,
        created_at,
      };
    case "DiscussionEvent":
      return {
        number: data.payload.discussion.number,
        title: data.payload.discussion.title,
        created_at,
      };
    case "ForkEvent":
      return {
        forkee: data.payload.forkee.full_name,
        sourceRepo: data.repo.name,
        created_at,
      };
    case "GollumEvent":
      return {
        action: data.payload.pages[0].action,
        pageName: data.payload.pages[0].page_name,
        pages: data.payload.pages.length,
        repo: data.repo.name,
        created_at,
      };
    case "IssueCommentEvent":
      const prNo = data.payload.issue.pull_request
        ? extractRef(data.payload.issue.pull_request.url)
        : "";
      return {
        action: data.payload.action,
        pullRequest: data.payload.issue.pull_request,
        prNo,
        issueNo: data.payload.issue.number,
        issueTitle: data.payload.issue.title,
        created_at,
      };

    case "IssuesEvent":
      return {
        action: data.payload.action,
        data,
      };
    case "MemberEvent":
      return {
        action: data.payload.action,
        member: data.payload.member.login,
        repo: data.repo.name,
        created_at,
      };
    case "PublicEvent":
      return {
        repo: data.repo.name,
        created_at,
      };
    case "PullRequestEvent":
      return {
        action: data.payload.action,
        data,
      };

    case "PullRequestReviewEvent":
      return {
        action: data.payload.action,
        repo: data.repo.name,
        prNo: data.payload.pull_request.number,
        created_at,
      };
    case "PullRequestReviewCommentEvent":
      return {
        action: data.payload.action,
        repo: data.repo.name,
        prNo: data.payload.pull_request.number,
        created_at,
      };
    case "ReleaseEvent":
      return {
        action: data.payload.action,
        repo: data.repo.name,
        tagName: data.payload.release.tag_name,
        releaseName: data.payload.release.name,
        created_at,
      };
    case "WatchEvent":
      return {
        action: data.payload.action,
        repo: data.repo.name,
        created_at,
      };

    default:
      return "";
  }
};
const getUserActivity = async (username) => {
  const response = await fetch(
    `https://api.github.com/users/${username}/events`,
  );
  if (!response.ok) {
    return `Error: Github returned ${response.status}`;
  }
  return await response.json();
};
const processActivity = (act) => {
  let payload = "";
  if (act.length === 0) {
    console.log("No activity found");
  } else {
    act.forEach((activity) => {
      const result = formatPayload(activity.type, activity);
      payload = formatActivityType(activity.type, result);
      return payload ? console.log(`- ${payload}`) : null;
    });
  }
  537394;
  return payload ? payload : "No activity found";
};
const formatIssueEvent = (act, data) => {
  switch (act) {
    case "opened":
    case "closed":
    case "reopened":
    case "edited":
    case "deleted":
    case "transferred":
    case "pinned":
    case "unpinned":
    case "locked":
    case "unlocked":
      return `${data.data.payload.action} issue #${data.data.payload.issue.number} in ${data.data.repo.name} at ${data.data.created_at}`;
    case "labeled":
      return `Added label ${data.data.payload.issue.labels[0].name} to issue #${data.data.payload.issue.number} in ${data.data.repo.name} at ${data.data.created_at}`;
    case "unlabeled":
      return `Removed label ${data.data.payload.issue.labels[0].name} from issue #${data.data.payload.issue.number} in ${data.data.repo.name} at ${data.data.created_at}`;
    case "assigned":
      return `Assigned ${data.data.payload.assignees[0].login} to issue #${data.data.payload.issue.number} in ${data.data.repo.name} at ${data.data.created_at}`;
    case "unassigned":
      return `Un-assigned ${data.data.payload.assignees[0].login} from issue #${data.data.payload.issue.number} in ${data.data.repo.name} at ${data.data.created_at}`;
    case "milestoned":
      return `Added milestone ${data.data.payload.issue.milestone.title} to issue #${data.data.payload.issue.number} in ${data.data.repo.name} at ${data.data.created_at}`;
    case "demilestoned":
      return `Removed milestone ${data.data.payload.issue.milestone.title} from issue #${data.data.payload.issue.number} in ${data.data.repo.name} at ${data.data.created_at}`;
    default:
      return;
  }
};
const formatPullRequestEvent = (act, data) => {
  switch (act) {
    case "opened":
    case "closed":
    case "reopened":
      return `${data.data.payload.action} PR #${data.data.payload.pull_request.number} in ${data.data.repo.name} at ${data.data.created_at}`;
    case "labeled":
      return `Added label ${data.data.payload.label.name} to PR #${data.data.payload.pull_request.number} in ${data.data.repo.name} at ${data.data.created_at}`;
    case "unlabeled":
      return `Removed label from PR #${data.data.payload.pull_request.number} in ${data.data.repo.name} at ${data.data.created_at}`;
    case "assigned":
      return `Assigned ${data.data.payload.assignee.login} to PR #${data.data.payload.pull_request.number} in ${data.data.repo.name} at ${data.data.created_at}`;
    case "unassigned":
      return `Un-assigned member from PR #${data.data.payload.pull_request.number} in ${data.data.repo.name} at ${data.data.created_at}`;
    default:
      return;
  }
};
getUserActivity(username)
  .then((res) => {
    writeFileSync("events.json", JSON.stringify(res));
    processActivity(res);
  })
  .catch((err) => {
    console.error("Error:", err);
  });
