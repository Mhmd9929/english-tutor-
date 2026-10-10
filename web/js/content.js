// Built-in learning content: topics, role plays, word lists, practice sentences, badges.

export const AVATARS = ['🦊', '🐼', '🐯', '🐸', '🦄', '🐵', '🐧', '🐨', '🦁', '🐰', '🐶', '🐱', '🐙', '🦖', '🚀', '⚽', '🌸', '🎸', '👩', '👨', '👵', '👴', '🧒', '👧'];

export const LEVELS = ['Beginner', 'Elementary', 'Intermediate', 'Advanced'];

export const TOPICS = [
  { id: 'school', label: 'School', emoji: '🏫' },
  { id: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
  { id: 'food', label: 'Food', emoji: '🍕' },
  { id: 'animals', label: 'Animals', emoji: '🐘' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'hobbies', label: 'Hobbies', emoji: '🎨' },
];

export const ROLEPLAYS = [
  { id: 'restaurant', label: 'At a restaurant', emoji: '🍝' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'doctor', label: 'At the doctor', emoji: '🩺' },
  { id: 'friend', label: 'Meeting a new friend', emoji: '🤝' },
  { id: 'airport', label: 'At the airport', emoji: '🛫' },
];

export const STORY_THEMES = [
  'a lost puppy', 'a picnic in the park', 'a trip to the beach', 'a magic tree',
  'a rainy day', 'a birthday surprise', 'a robot friend', 'a visit to the farm',
  'a treasure map', 'the first day at a new club',
];

export const MODES = [
  { id: 'free', title: 'Free Talk', emoji: '💬', desc: 'Chat about fun topics', color: 'c1' },
  { id: 'roleplay', title: 'Role Play', emoji: '🎭', desc: 'Restaurant, shop, airport…', color: 'c2' },
  { id: 'words', title: 'Word of the Day', emoji: '📚', desc: 'Learn 5 new words', color: 'c3' },
  { id: 'story', title: 'Story Time', emoji: '📖', desc: 'Listen and answer', color: 'c4' },
  { id: 'pron', title: 'Pronunciation', emoji: '🎤', desc: 'Say it like Buddy', color: 'c5' },
];

// Words: [word, simple meaning, emoji]
export const WORDS = {
  Beginner: [
    ['happy', 'feeling good', '😊'], ['big', 'large, not small', '🐘'], ['small', 'little, not big', '🐭'],
    ['run', 'move fast with your legs', '🏃'], ['jump', 'go up in the air', '🦘'], ['eat', 'put food in your mouth', '🍎'],
    ['drink', 'take water or juice', '🥤'], ['sleep', 'rest at night with eyes closed', '😴'], ['friend', 'someone you like to play with', '🤝'],
    ['hot', 'very warm', '🔥'], ['cold', 'not warm', '🧊'], ['red', 'the color of strawberries', '🍓'],
    ['blue', 'the color of the sky', '🌊'], ['cat', 'a small furry pet that says meow', '🐱'], ['dog', 'a pet that barks', '🐶'],
    ['book', 'pages with words and pictures', '📘'], ['ball', 'a round toy', '⚽'], ['sun', 'the bright light in the sky', '☀️'],
    ['rain', 'water falling from clouds', '🌧️'], ['tree', 'a tall plant with leaves', '🌳'], ['house', 'a building where people live', '🏠'],
    ['school', 'where children learn', '🏫'], ['milk', 'a white drink', '🥛'], ['fish', 'an animal that swims', '🐟'],
    ['bird', 'an animal that can fly', '🐦'], ['car', 'it has four wheels and drives on roads', '🚗'], ['play', 'have fun with games or toys', '🧸'],
    ['sing', 'make music with your voice', '🎤'], ['smile', 'a happy face', '😁'], ['star', 'a small light in the night sky', '⭐'],
    ['open', 'not closed', '🚪'], ['fast', 'very quick', '⚡'], ['slow', 'not fast', '🐢'], ['clean', 'not dirty', '🧼'], ['funny', 'it makes you laugh', '🤡'],
  ],
  Elementary: [
    ['brave', 'not afraid', '🦁'], ['delicious', 'tastes very good', '😋'], ['noisy', 'making a lot of sound', '📢'],
    ['quiet', 'making little or no sound', '🤫'], ['borrow', 'take something and give it back later', '📚'], ['careful', 'paying attention to avoid danger', '⚠️'],
    ['hungry', 'wanting to eat', '🍽️'], ['tired', 'needing rest', '🥱'], ['weekend', 'Saturday and Sunday', '📅'],
    ['visit', 'go to see a person or place', '🏡'], ['favourite', 'the one you like best', '💖'], ['dangerous', 'could hurt you', '🚧'],
    ['healthy', 'good for your body', '🥦'], ['invite', 'ask someone to come', '💌'], ['kind', 'nice and helpful to others', '🤗'],
    ['lucky', 'good things happen to you by chance', '🍀'], ['message', 'words you send to someone', '✉️'], ['neighbour', 'a person who lives next to you', '🏘️'],
    ['picnic', 'a meal outside', '🧺'], ['ready', 'prepared to do something', '✅'], ['surprise', 'something you did not expect', '🎁'],
    ['travel', 'go to other places', '🧳'], ['umbrella', 'it keeps you dry in the rain', '☂️'], ['vegetable', 'a plant we eat, like a carrot', '🥕'],
    ['wonderful', 'very, very good', '🌈'], ['clever', 'quick at learning', '🧠'], ['forget', 'not remember', '❓'],
    ['practice', 'do something again to get better', '🔁'], ['proud', 'happy about something you did well', '🏅'], ['share', 'give part of something to others', '🍪'],
    ['early', 'before the usual time', '🌅'], ['late', 'after the usual time', '⏰'], ['busy', 'having lots to do', '🐝'], ['calm', 'peaceful, not worried', '🧘'],
  ],
  Intermediate: [
    ['curious', 'wanting to know or learn something', '🔍'], ['generous', 'happy to give to others', '🎁'], ['improve', 'make or become better', '📈'],
    ['confident', 'sure of yourself', '💪'], ['disappointed', 'sad because something was not as good as hoped', '😞'], ['explore', 'travel through a place to learn about it', '🧭'],
    ['patient', 'able to wait calmly', '⏳'], ['recommend', 'suggest something is good', '👍'], ['schedule', 'a plan of times for things', '🗓️'],
    ['convenient', 'easy and useful for you', '🛒'], ['opportunity', 'a chance to do something', '🚪'], ['ingredient', 'one part of a recipe', '🧂'],
    ['challenge', 'something difficult to do', '🧗'], ['achieve', 'succeed in doing something', '🏆'], ['appreciate', 'be thankful for', '🙏'],
    ['decision', 'a choice you make', '🤔'], ['environment', 'the natural world around us', '🌍'], ['familiar', 'well known to you', '🏠'],
    ['comfortable', 'relaxed, with no pain', '🛋️'], ['experience', 'something that happens to you', '🎢'], ['honest', 'telling the truth', '🗣️'],
    ['imagine', 'make a picture in your mind', '💭'], ['nervous', 'a little worried or afraid', '😬'], ['complain', 'say you are not happy about something', '😤'],
    ['celebrate', 'do something fun for a special day', '🎉'], ['crowded', 'full of people', '👥'], ['volunteer', 'help without being paid', '🙋'],
    ['reliable', 'you can trust it', '🔒'], ['suggest', 'give an idea', '💡'], ['prefer', 'like one thing more than another', '⚖️'],
  ],
  Advanced: [
    ['resilient', 'able to recover quickly from difficulties', '🌱'], ['meticulous', 'very careful about details', '🔬'], ['ambiguous', 'having more than one possible meaning', '❔'],
    ['pragmatic', 'practical and realistic', '🛠️'], ['eloquent', 'speaking clearly and beautifully', '🎙️'], ['inevitable', 'certain to happen', '⌛'],
    ['scrutinize', 'examine very carefully', '🧐'], ['versatile', 'able to do many different things', '🔀'], ['diligent', 'hard-working and careful', '📝'],
    ['nostalgic', 'missing happy times from the past', '📼'], ['spontaneous', 'done without planning', '🎲'], ['compelling', 'very interesting, hard to ignore', '🧲'],
    ['mitigate', 'make something less bad', '🩹'], ['candid', 'honest and direct', '💬'], ['tedious', 'boring and too long', '😑'],
    ['thrive', 'grow and do very well', '🌻'], ['elaborate', 'explain in more detail', '🧩'], ['feasible', 'possible and practical to do', '✅'],
    ['innovative', 'new and creative', '🚀'], ['cautious', 'careful to avoid risks', '🦺'], ['perceive', 'notice or understand', '👁️'],
    ['reluctant', 'not wanting to do something', '🙅'], ['subtle', 'small and not obvious', '🌫️'], ['vivid', 'very bright and clear', '🎨'],
    ['wholesome', 'good for you, morally or physically', '🥗'], ['frugal', 'careful with money', '💰'], ['overwhelmed', 'feeling there is too much to handle', '🌊'],
    ['commute', 'travel regularly to work or school', '🚆'], ['procrastinate', 'delay doing something', '🛋️'], ['articulate', 'express ideas clearly', '🗨️'],
  ],
};

export const SENTENCES = {
  Beginner: [
    'I like apples.', 'The cat is small.', 'I can run fast.', 'My dog is happy.', 'The sun is hot.',
    'I have a red ball.', 'We play in the park.', 'She likes to sing.', 'This is my book.', 'The bird can fly.',
    'I drink milk every day.', 'The tree is very big.', 'I love my family.', 'It is a sunny day.', 'Look at the stars.',
  ],
  Elementary: [
    'I am going to the park after school.', 'My favourite food is pizza.', 'Can I borrow your pencil, please?',
    'We visited my grandmother last weekend.', 'The weather is cold and rainy today.', 'He is the fastest runner in our class.',
    'Please be careful when you cross the road.', 'I usually wake up at seven o clock.', 'There are three birds on the tree.',
    'She brushes her teeth twice a day.', 'Thank you very much for your help.', 'Would you like some orange juice?',
  ],
  Intermediate: [
    'I would like to book a table for four people.', 'Could you tell me where the nearest station is?',
    'I have been learning English for two years.', 'If it rains tomorrow, we will stay at home.',
    'She recommended a wonderful book about the ocean.', 'We should protect the environment for the future.',
    'I am looking forward to the summer holidays.', 'He was nervous before his first football match.',
    'The museum was more interesting than I expected.', 'Excuse me, how much does this jacket cost?',
  ],
  Advanced: [
    'Thoroughly understanding the problem is the first step toward solving it.',
    'Although the weather was dreadful, the festival was surprisingly enjoyable.',
    'Technology has dramatically transformed the way we communicate with each other.',
    'She delivered an eloquent speech that captivated the entire audience.',
    'It is inevitable that we will make mistakes while learning a new language.',
    'The architecture of the old cathedral is absolutely breathtaking.',
    'I would appreciate it if you could clarify the details of the schedule.',
    'Resilient people tend to view challenges as opportunities for growth.',
  ],
};

// Badges: condition receives a progress summary.
export const BADGES = [
  { id: 'first', emoji: '🌟', name: 'First Chat', desc: 'Said your first sentence', test: (s) => s.messages >= 1 },
  { id: 'chatter', emoji: '💬', name: 'Chatterbox', desc: 'Sent 50 messages', test: (s) => s.messages >= 50 },
  { id: 'streak3', emoji: '🔥', name: '3-Day Streak', desc: 'Practised 3 days in a row', test: (s) => s.bestStreak >= 3 },
  { id: 'streak7', emoji: '🏆', name: 'Week Champion', desc: 'Practised 7 days in a row', test: (s) => s.bestStreak >= 7 },
  { id: 'words10', emoji: '📚', name: 'Word Collector', desc: 'Learned 10 words', test: (s) => s.words >= 10 },
  { id: 'words50', emoji: '🧠', name: 'Word Wizard', desc: 'Learned 50 words', test: (s) => s.words >= 50 },
  { id: 'min30', emoji: '⏱️', name: 'Half Hour Hero', desc: 'Practised 30 minutes', test: (s) => s.minutes >= 30 },
  { id: 'min120', emoji: '🚀', name: 'Super Learner', desc: 'Practised 2 hours', test: (s) => s.minutes >= 120 },
  { id: 'perfect', emoji: '🎯', name: 'Perfect Speaker', desc: '100% in pronunciation', test: (s) => s.pronBest >= 100 },
  { id: 'story', emoji: '📖', name: 'Story Lover', desc: 'Finished a story session', test: (s) => (s.modes.story || 0) >= 1 },
  { id: 'actor', emoji: '🎭', name: 'Little Actor', desc: 'Tried a role play', test: (s) => (s.modes.roleplay || 0) >= 1 },
  { id: 'stars100', emoji: '💫', name: '100 Stars', desc: 'Collected 100 stars', test: (s) => s.stars >= 100 },
];
