export type FeedbackType =
  | 'bug_report'
  | 'feature_request'
  | 'general_feedback'
  | 'ui_ux_feedback'
  | 'performance_issue';

export interface UserFeedback {
  id: string;
  user_id: string;
  feedback_type: FeedbackType;
  comment: string;
  created_at: string;
}

export interface UserFeedbackInsert {
  user_id: string;
  feedback_type: FeedbackType;
  comment: string;
}
