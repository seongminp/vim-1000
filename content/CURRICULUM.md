# Intermediate Vim: the curated 300

Audience: users who already know modes and basic movement. The 711 remaining quizzes stay available as extra practice. All quiz data lives in `quizzes.json`; the manifest stores only references.

Selection prioritizes clear, useful targets, distinct editing decisions and native-compatible commands already supported by the trainer. Repetition revisits skills in different contexts; it never repeats an identical exercise. These internal rounds do not appear as a curriculum menu.

## Sequence

### 1–25: Precision without counting characters

Warm up with useful edits, then contrast word boundaries, line boundaries and character targets. Introduce repeat immediately.

1. Fix “teh” to read “the”.
2. Rename “count” to “total”, keeping the comma.
3. Remove the “--verbose” flag.
4. Change the first CSV field to “Mina”.
5. Swap the first two lines.
6. Overwrite the three-letter month without disturbing the date.
7. Change the first comma to a colon.
8. Delete only the indentation before the heading.
9. Comment out the indented “return” line.
10. Empty the parentheses.
11. Add a semicolon to each of the three statements.
12. Change the colon after “port” to “=”.
13. Indent both statements inside the block by two spaces.
14. Replace the file path with “src/app.ts”.
15. Delete the two leading path components.
16. Raise the shard count from 9 to 12, leaving replicas alone.
17. Delete everything before the semicolon.
18. Change the suffix “Name” to “Id”.
19. Put “// ” at absolute column zero, preserving the call’s original indentation.
20. Change only the second comma to a semicolon.
21. Delete the final path segment, keeping its slash.
22. Join the path without adding a space.
23. Replace only the nested parentheses contents with “user”.
24. Indent the two nonadjacent return statements once.
25. Convert the two-line robot greeting into one line with a colon.

### 26–50: Objects and repeatable changes

Build edits around semantic boundaries; alternate inner/around, nested objects, prose and dot repeat rather than memorizing a single recipe.

26. Delete the parenthetical aside and the extra separating space.
27. Change the text inside the quotes.
28. Replace only the inner list with “ready”.
29. Remove the two redundant “really” modifiers.
30. Empty the button without removing its disabled attribute.
31. Remove the first sentence and its separating spaces.
32. Uppercase the complete dotted constant.
33. Change both quoted milk choices to “oat”, skipping the roast setting.
34. Clear the inner object without changing the outer one.
35. Replace the complete single-quoted token with the unquoted word null.
36. Change the single-quoted value to “production”.
37. Uppercase the emphasis text while keeping its markup.
38. Increase both limits by two using dot repeat.
39. Delete the final note paragraph but keep the blank separator before it.
40. Append “.value” immediately after the nested call.
41. Replace both two-word placeholders with “OK”.
42. Replace the middle paragraph with a one-line summary.
43. Open the two locked doors while keeping the stone walls.
44. Uppercase only the middle paragraph.
45. Remove the “temp.” prefix from three property accesses.
46. Replace the inner array with a call to “getSnacks()”, removing its brackets.
47. Remove the whispered aside and end the library instruction with an exclamation mark.
48. Add “await ” before both indented calls.
49. Invert the case of the mixed-case flag only.
50. Change the Markdown link destination while preserving its label.

### 51–75: Search as a motion

Contrast forward/backward search, whole words, anchors and literal punctuation. Revisit local edits between search problems.

51. Uppercase the next whole-word “warn”, leaving “warning” unchanged.
52. Mark the nearest earlier TODO as DONE.
53. Replace the middle “:” with “=” after overshooting to the last one.
54. Remove the exact closing marker, preserving the longer marker name.
55. Rename the next standalone “data”, then the following one, leaving “database”.
56. Remove the three trailing semicolons from this line.
57. Change the middle “draft” label to “final”.
58. Remove the line containing the literal “[skip]” marker.
59. Remove “https:” from the URL.
60. Remove the literal “.tmp” suffix from the matching filename only.
61. Uppercase the first sentence, keeping the second unchanged.
62. Remove the last diagnostic line before the footer.
63. Uppercase the earlier “warn” label, leaving the current one alone.
64. Keep the colon but replace the key with “timeout”.
65. Replace the quoted value on the “region” line with “east”.
66. Delete the line immediately above the END marker.
67. Change the outer square brackets to parentheses, preserving the nested list.
68. Remove the actual “console.log” call, keeping “consoleXlog”.
69. After finding the next marker, go back and delete the original marker line.
70. Change the value on the line containing literal “a.b”, preserving “axb”.
71. Replace only the final “pending” status on its line.
72. Change the previous chapter heading to uppercase.
73. Change the hyphenated package name without changing its version.
74. Clear the arguments only on the call marked “retry”.
75. Change the timeout only in the staging block.

### 76–100: Keep and reuse text

Introduce yanks, protected registers, named registers and buffers/windows; space them with precision and object retrieval.

76. Copy “customer_id” into the empty argument list.
77. Open the recipe buffer without changing either file.
78. Replace the word “wrong” with the earlier yanked “correct”.
79. Open guide.txt beside main.js, with the guide active on the left.
80. Delete “obsolete” and copy “template” below “final”.
81. Remove the nested emphasis but keep the surrounding link.
82. Open config.json by name, leaving the notes alone.
83. Copy the quoted string, including quotes, into the empty assignment.
84. Focus main.js in the right pane without closing the guide.
85. Delete the draft row, then paste the original yank below the body.
86. Change the second colon to “=”.
87. Copy the header below the body while deleting the obsolete row.
88. Move the parenthesized group after the equals sign on the next line.
89. Change both “cold” words to “warm”.
90. Visit the menu, then return to the alternate buffer: orders.txt.
91. Copy “BOO!” into the empty sign without stealing its exclamation mark.
92. Collect the two separated command lines and paste them below RUN.
93. Indent only the final three statements once.
94. Copy the inner parentheses into the empty square brackets.
95. Uppercase the entire quoted warning, including both words.
96. Return to the marked column and replace the first digit with 9.
97. Keep the first word in register a while replacing the final word with it.
98. Remove scratch.txt from the buffer list; keep both project files loaded.
99. Remove the emphasis wrapper but keep “urgent”.
100. Copy “Moon Spoon” into the empty sign and save it, keeping both panes.

### 101–125: Shape lines, columns and ranges

Practice block operations and Ex addressing while revisiting buffers, registers and paragraph edits.

101. Remove the two-character gutter from all three lines.
102. Remove the current line and the following two lines.
103. Open notes.txt above the recipe, keeping both visible.
104. Insert an equals sign between the aligned key and value columns.
105. Indent all three statements one level.
106. Delete the marked three-line draft section.
107. Delete the entire block between the header and footer, leaving those two lines.
108. Uppercase the first two columns while leaving the suffixes alone.
109. Open the previous buffer: the launch checklist.
110. Shift the two statements right by two indentation levels.
111. Replace the two-character status codes with “OK”.
112. Delete only the next two rows, keeping the current anchor.
113. Insert “// ” before all three statements.
114. Duplicate the bracketed list on the next line, including its brackets.
115. Fix “teh” in draft.txt, save it, and return to notes.txt.
116. Delete the two rows immediately before the current END marker.
117. Uppercase the entire two-line warning.
118. Remove trailing commas from the current line through EOF.
119. Move the release note directly below the heading.
120. Remove the “// ” prefixes from the three indented calls.
121. Move to the lower pane, fix “teh” to “the”, and save the log.
122. Replace the middle two properties with a copied first property.
123. Indent the second paragraph twice without shifting its blank separators.
124. Keep only the guide pane; leave main.js in the buffer list.
125. Comment out the current line and the next two lines with “# ”.

### 126–150: Control the scope of replacement

Contrast one line, a range and the whole file; first versus all matches; escaped literals and case control. Start quickfix and macro practice.

126. Replace all “dev” on this line only.
127. Change only the first comma on each row to a colon.
128. Normalize every semicolon separator to a comma.
129. Show the supplied three-item diagnostic list.
130. Change “off” to “on” on lines 2 and 3 only.
131. Replace either uppercase or lowercase “yes” with true.
132. Jump to diagnostic 2, fix its typo, and save ui.js.
133. Remove trailing spaces from every line.
134. Increase the first number in each release row by one.
135. Alphabetize only the three items between the section markers.
136. Remove the slash at the end of each path.
137. Delete commented lines only within the middle three-line section.
138. Wrap each ERROR label in square brackets.
139. Copy “reusable” below “finish”.
140. Turn the trailing “px” units into “rem” without changing the numbers.
141. Keep only HTTP GET records.
142. Uppercase the word at the beginning of the next indented warning.
143. Replace every tab with two spaces.
144. Rename only the first “old” on each line to “new”.
145. Order the priorities numerically from smallest to largest.
146. Remove the “.bak” suffix from the filenames.
147. Wrap every numeric token in square brackets.
148. Jump to the second diagnostic in ui.js.
149. Remove the log timestamp and its following space from each line.
150. Change “off” to “on” only in the final two settings.

### 151–175: Reliable repeated edits

Build macros around reliable anchors and deliberate movement. Interleave dot, scoped replacements and register recall; include last-macro replay.

151. Merge each label and its value onto one line.
152. Add a semicolon to the return statement.
153. Replace the first separator on each record, leaving later separators intact.
154. Change the status column from “x” to “o” on all three rows.
155. Uncomment the three commands, keeping the footer.
156. Keep only lines beginning with a digit.
157. Copy the first line after both section headings.
158. Convert each “name: value” row to “name=value”.
159. Delete the empty separator between the two settings.
160. Put “- ” at the start of every line.
161. Remove comment lines only in the current four-line selection range.
162. Turn each opening tag into a matching closing tag.
163. Yank the first line, visit the footer, then return and paste below the mark.
164. Raise each ticket number by one while leaving the year unchanged.
165. Normalize colon spacing without touching colons inside times.
166. Find the version number and increase it by one.
167. Copy each setting name into its own quoted value.
168. Uppercase the last two words, including the hyphenated suffix.
169. Turn each fault row into a commented note without its leading code.
170. Add a semicolon only to rows that contain an assignment.
171. Replace both bracket pairs with empty brackets, leaving surrounding text.
172. Jump directly to the last diagnostic in tests.js.
173. Add an “await ” prefix only to the two call lines, skipping their comment rows.
174. Sort the dependency list and remove duplicate entries.
175. Change each second argument to “null”.

### 176–200: Native patterns and structured replacements

Practice Vim captures, boundaries and replacement text in useful transformations, interleaved with macro, object and workspace review.

176. Remove a leading numeric ID followed by a tab.
177. Remove “px” only after a digit, preserving the word “pxlabel”.
178. Change both quoted values to “ready”.
179. Quote each setting key without changing its value.
180. Replace each literal dollar sign with “USD ”.
181. Find launch() in nested src files, excluding the test fixture.
182. Keep only nonempty quoted records.
183. Wrap each word in a SQL single-quoted value with a trailing comma, using register b.
184. Swap the two comma-separated fields on each row.
185. Copy the quoted message into the unquoted summary field.
186. Keep only the complete boolean values.
187. Replace the final word with the first word without losing punctuation.
188. Replace the colon-space separators with tabs.
189. Copy each identifier into its matching call.
190. Move the file extension into parentheses after the stem.
191. Find both “red” occurrences on the same line, then jump to the second.
192. Redact every quoted secret value after “token=”, leaving other quoted values alone.
193. Copy the title to the beginning of the final line.
194. Delete records with either “,failed” or “,cancelled” as the final status.
195. Reverse the date fields from YYYY/MM/DD to DD-MM-YYYY.
196. Mark all three books available and add an “AVAILABLE” heading.
197. Remove quotes only from numeric settings, preserving the label string.
198. Convert each “#define NAME value” into “NAME=value”.
199. Sort the records by the text after the colon.
200. Replace the whole second quoted slogan with the first, preserving the second line’s label.

### 201–225: Work across a project

Combine buffer/window knowledge, quickfix navigation and saved edits; reinforce selection and precision between larger tasks.

201. Fix and save the first two diagnostics, then return to the first.
202. Copy the first setting, delete the scratch row, then paste below END.
203. Rename the earlier matching “mode” after searching forward first.
204. Replace both quoted filenames with “settings.json”.
205. Copy the footer note below the marked section.
206. Turn each two-line question and answer into a single arrow row.
207. Replace spaces with underscores in the two labels only.
208. Open the diagnostics, visit the final entry, then hide the list.
209. Copy the middle two CSV fields into the empty value.
210. Keep only POST routes, remove their method, and sort the paths uniquely.
211. Remove the final two path components while retaining the directory slash.
212. Swap the contents of the two quoted values.
213. Change only the URL ending in “/preview” to end in “/live”.
214. Collapse each three-line name/value/separator record into “name=value”.
215. Replace the whole second paragraph with a copy of the first.
216. Order the track numbers numerically but leave the album title at the top and credits at the bottom.
217. Enable only the line with the trailing production comment.
218. Combine each plant and its next-line watering interval into one labeled row.
219. Collect the two quoted values into one line separated by a space.
220. Keep confirmed clues, strip the marker, and alphabetize the descriptions.
221. Find the two obsolete flags, change both to true, and save each file.
222. Insert the missing middle step by copying the first step, then rename only the copy.
223. Trim leading and trailing spaces from each quoted value, keeping interior spaces.
224. Copy the final two lines below the marked heading.
225. Convert each “key: value # note” row into “key=value”, dropping its note.

### 226–250: Recall under different conditions

Choose techniques from the target rather than a topical streak: punctuation-rich objects, reverse searches, blocks, registers, macros and patterns.

226. Replace the entire URL with “/health”.
227. Fix the oxygen value only in the occupied cabin.
228. Lowercase only the four-letter status column.
229. Switch the host to “new” only on enabled routes.
230. Decrease the second coordinate by 3.
231. Swap each setting from “key=value” to “value:key”.
232. Uppercase the text between the marked start and the final period.
233. Remove only the terminal “ (alternate)” label from timeline names.
234. Prefix the quoted route with “/api”.
235. Convert the three fields into a labeled summary in a different order.
236. Use register b to turn the paths into include directives.
237. Remove the record containing a literal parenthesized “draft”.
238. Fill both sides of the equality check with the saved identifier.
239. Collapse repeated hyphens in slugs to one hyphen.
240. Delete the quoted argument and its following comma-space.
241. Remove each evidence ID and wrap the remaining description in quotes.
242. Replace commas with semicolons only above the divider.
243. Replace the heading text, keeping its attributes.
244. Reuse “rainwater” in the two empty watering calls while keeping the source label.
245. Rename “old” to “new” everywhere except rows marked KEEP.
246. Increase the spare battery count by four, leaving the mission number unchanged.
247. Copy each key into a matching comment at the end of its row.
248. Normalize tabs or spaces between columns to one comma.
249. Replace the scary banner with “Welcome!” and remove its brackets.
250. Replace the two arguments after “user” with one options object.

### 251–275: Real maintenance, small decisions

Combine previously practiced tools in realistic code/configuration edits, with a few lighter tasks and spaced recall.

251. Remove the debug line, uncomment the return, and keep its indentation.
252. Change localhost in active settings but preserve the commented example.
253. Wrap the complete sentence in double quotes using a cut and an Insert-mode paste.
254. Split the sentence before “However” onto a new line.
255. Turn each item into a Markdown link to its own fragment.
256. Replace the FIXME comment with “// handled upstream”.
257. Deduplicate and alphabetize only the data rows, keeping both labels.
258. Replace the two-word phrase “very slow” with “responsive”.
259. Swap only the two values around the arrow, preserving the prefix.
260. Move the inline explanation onto its own preceding comment line.
261. Append “_id” to both keys before their equals signs.
262. Convert the dotted config key into an environment variable name.
263. Remove the aligned numeric ID column, keeping the names.
264. Convert each colon-separated pair into a two-item JSON array.
265. Replace only the exact “stop” line with “continue”.
266. Lowercase the robot command and add the “--politely” flag.
267. Remove surrounding square brackets but keep the inner comma-separated values.
268. Reuse “api_key” in both placeholders.
269. Turn the space-separated permissions into one permission per line.
270. Convert each env assignment to an export statement ending in a semicolon.
271. Replace the second sentence with “Ship it.”.
272. Use single quotes in imports but keep the double-quoted message.
273. Wrap the existing return expression in “Promise.resolve”.
274. Move “# done” above the call and add “// cooling” beside the call.
275. Turn seed packets into “quantity × species” labels, dropping the word “seeds”.

### 276–300: Mixed fluency checks

Finish with independently chosen, multi-step edits and cross-technique review. No new command family is required in the final stretch.

276. Turn the three-line name/email card into a single mailto link and remove the ID.
277. Remove the trailing slash and append “.html” to each route.
278. Turn the return list into unique, alphabetized bullets, removing comments.
279. Swap “alpha” and “beta” while keeping the equals signs.
280. Replace the first two arguments with “...args”, keeping the callback.
281. Remove the numeric timestamp and keep the complete message.
282. Indent the inner two statements and add semicolons.
283. Change each “fn name()” declaration to “function name() {}”.
284. Replace the final matching filename extension with “md”.
285. Quote both keys in the two-property object.
286. Copy the captain’s callsign into both empty radio messages.
287. Remove the remote timeline and disable paradox mode on the remaining local timelines.
288. Move the fallback value outside the call using “ ?? ”.
289. Swap the two fields in each CSV row.
290. Delete all text between the two vertical bars, leaving both bars.
291. Convert each numeric pixel value into a calc expression.
292. Change both the key and the boolean in the feature flag.
293. Turn each key/value pair into a JSON property.
294. Move the “TODO” marker from the end to the beginning of the comment.
295. Keep the audio-guide lines, strip their IDs, and join them into one sentence.
296. Change the destination to “tomorrow” and remove the dangerous override.
297. Turn each service into a restart command followed by an echo of its name.
298. Sort dishes by cooking time, then show each as “dish: time minutes”.
299. Turn the three comma-separated snacks into separate bullet lines.
300. Turn chat rows into “speaker: message”, removing the timestamp.

## Similarity review

No selected exercises have identical before/after pairs or identical model key sequences. Structural similarities are candidates for human judgment, not proof of duplication. The retained contrasts are:

- Backward F versus forward f and semicolon repetition: different navigation choices, revisited later.
- Whole-word forward/backward search versus a visual block: similar case-change result, different scope and tools.
- Returning with N after whole-word search versus typed search; different start positions and spaced recall.
- Deliberate contrast: recover a yank with register 0 versus protect it explicitly in a named register.
- Relative Ex range versus a marked linewise range: same deletion shape, different location strategy.
- Positive versus negative relative addresses, with the anchor on opposite sides of the deletion.

## Scope and limits

This path covers the supported editing and simulated workspace skills. It does not add unsupported Vim features or claim expertise from completion alone. Timed/adaptive review, undo-history exercises, location lists, shell/compiler workflows and real project practice are not provided by this curation. Difficulty is editorial, not measured.

The last 75 questions mix earlier skills and contain no new command family. Shuffle still samples the full bank when explicitly enabled; normal sequential navigation follows this path and then extra practice. Existing saved attempts and completions retain their content IDs.
