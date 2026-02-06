
export type Vocab={id:string;en:string;hi?:string;kn:string;tr_simple?:string;examples?:{en:string;hi:string;kn:string;tr_simple:string}[]}
export type Sentence={id:string;en:string;hi:string;kn:string;tr_simple?:string}
export type Conversation={id:string;topic:string;turns:{en:string;hi:string;kn:string;tr_simple?:string}[]}
export type Tense={id:string;name:string;templates?:{en:string;hi:string;kn:string};kn?:string;tr_simple?:string}
export type Module={id:string;title:string;description:string;refs:string[]}
