> From: https://gemini.google.com/app/0dfd6c47f30fafe1

# you asked

message time: 2026-07-17 20:44:56

what is the EAN/UPC number of a book, and is there a programatic way to fetch them?

---

# gemini response

## What are EAN, UPC, and ISBN Numbers for Books?

When it comes to books, **ISBN, EAN, and UPC** are closely related identifiers that allow retailers, libraries, and distributors to track inventory. 

* **ISBN (International Standard Book Number):** The unique commercial identifier for books. Since January 2007, all ISBNs are 13 digits long (ISBN-13). Prior to that, they were 10 digits (ISBN-10).
* **EAN (European Article Number):** A 13-digit global barcode standard used for retail products. **An ISBN-13 is a subset of the EAN system.** Specifically, all book EANs start with the "Bookland" prefix **978** or **979**. Therefore, **a book's ISBN-13 is its EAN number.**
* **UPC (Universal Product Code):** A 12-digit format used primarily in North America. Standard books do not use UPCs directly. However, an EAN (ISBN-13) is converted to a UPC on some retail systems by prepending a leading zero (though this is often treated interchangeably by modern scanners). Some mass-market paperbacks or book-adjacent items sold in supermarkets may have a standard 12-digit UPC printed on them in place of or in addition to the ISBN.

---

## How to Fetch Book Metadata Programmatically

If you have an ISBN/EAN and want to fetch book details (or vice-versa), you have several excellent, free programmatic options.

### 1. Open Library API (No Authentication Required)
Managed by the Internet Archive, the Open Library API is completely free, open, and requires no API keys. 

You can retrieve a book's JSON data directly using its EAN/ISBN-13:
`[https://openlibrary.org/api/volumes/brief/isbn/](https://openlibrary.org/api/volumes/brief/isbn/){ISBN}.json`

Here is how to fetch it using Python:

```python
import requests

def get_book_details(isbn):
    # Clean the input to keep only numbers
    clean_isbn = "".join(filter(str.isdigit, isbn))
    url = f"https://openlibrary.org/api/volumes/brief/isbn/{clean_isbn}.json"
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            # Navigate the JSON response structure
            records = data.get("records", {})
            if records:
                # Get the first record key (which is the OL ID)
                ol_key = list(records.keys())[0]
                book_data = records[ol_key].get("data", {})
                
                return {
                    "title": book_data.get("title"),
                    "publish_date": book_data.get("publish_date"),
                    "publishers": [p.get("name") for p in book_data.get("publishers", [])],
                    "eans": records[ol_key].get("isbns", [])
                }
    except Exception as e:
        print(f"Error fetching data: {e}")
    return None

# Example usage (EAN/ISBN-13 for 'The Hobbit')
print(get_book_details("9780261102217"))
```

### 2. Google Books API (Free, Optional API Key)
The Google Books API is incredibly fast and has massive coverage. You can query it anonymously for basic lookups using:
`[https://www.googleapis.com/books/v1/volumes?q=isbn](https://www.googleapis.com/books/v1/volumes?q=isbn):{ISBN}`

```python
import requests

def fetch_from_google(isbn):
    url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}"
    response = requests.get(url).json()
    
    if "items" in response:
        volume_info = response["items"][0]["volumeInfo"]
        return {
            "title": volume_info.get("title"),
            "authors": volume_info.get("authors", []),
            "publisher": volume_info.get("publisher"),
            "industry_identifiers": volume_info.get("industryIdentifiers", []) # Contains ISBN_10 and ISBN_13 (EAN)
        }
    return "Book not found"

print(fetch_from_google("9780261102217"))
```

### 3. Dedicated Libraries (e.g., `isbnlib` for Python)
If you are working in Python, there is a dedicated library called `isbnlib`. It validates format check-digits locally and can scrape multiple open-metadata services simultaneously.

```bash
pip install isbnlib
```

```python
import isbnlib

# Validate an EAN/ISBN
is_valid = isbnlib.is_isbn13("9780261102217") # Returns True/False

# Fetch metadata from multiple blended open registries
metadata = isbnlib.meta("9780261102217")
print(metadata)
```

---

<FollowUp label="Want to see how to convert an older 10-digit ISBN into a modern 13-digit EAN?" query="How do you write a Python function to convert an ISBN-10 to an ISBN-13 / EAN-13?"/>

For a step-by-step developer tutorial on exploring these endpoints, check out this [Open Library API Walkthrough](https://www.youtube.com/watch?v=reN_okp2Gq4) which demonstrates live requests, searching by ISBN, and digging into book data dumps.

---

# you asked

message time: 2026-07-18 16:55:23

Bookshop.org's affiliate link is built like /a/{a_id}/{isbn}
I want to automate a webpage that makes it easy for me to add new book reviews with my affiliate link. I don't want to over automate with one of those apis if it's going to introduce errors. What options do you see here?

---

# gemini response

Since you are looking to build a clean review workflow without getting bogged down in messy API payloads, you have some great middle-ground options. 

The biggest challenge with book data is that titles can have dozens of different editions, each with its own unique EAN/ISBN-13 (paperback, hardcover, audio, special editions). If an automation guesses the wrong one, your Bookshop.org link breaks or points to the wrong product.

Here are three practical, error-resistant approaches that keep you in control without over-engineering:

---

## Option 1: The "Semi-Automated" Clipboard Script (Safest)
Instead of building a massive system, you can use a tiny local script or a browser extension tool (like Tampermonkey) to help you harvest the right number while you browse. 

* **The Workflow:** You find the exact book edition you want to review on a site like Goodreads, StoryGraph, or Amazon. You click a shortcut or bookmarklet on your browser. The script extracts the ISBN directly from that page's URL or metadata and copies your finalized Bookshop.org link (`bookshop.org/a/{your_id}/{isbn}`) directly to your clipboard.
* **Why it works:** You get 100% human accuracy on *which* edition you are linking to, but 0% manual typing errors. 
* **Tech needed:** A simple Javascript **Bookmarklet** that you drag to your browser bookmarks bar.

```javascript
// Example Bookmarklet Code to extract ISBN from a URL and copy your link
javascript:(function(){
  var match = document.location.href.match(/(?:isbn|dp|product)\/?([0-9X]{10,13})/i);
  if(match) {
    var affiliateUrl = 'https://bookshop.org/a/YOUR_AFFILIATE_ID/' + match[1];
    navigator.clipboard.writeText(affiliateUrl);
    alert('Affiliate link copied!');
  } else {
    alert('No ISBN found in URL');
  }
})();
```

---

## Option 2: The Spreadsheet Data-Validation Pipeline
If you want to queue up multiple reviews at once, a spreadsheet macro (Google Sheets or Excel) lets you bulk-generate links cleanly without touching an IDE.

* **The Workflow:** You type or paste the raw book details (Title, Author, and whatever ISBN you found) into a spreadsheet. You use a built-in script to fetch *just* the official book cover and confirmed ISBN-13 from a basic Google Books ping to verify it looks right. A final formula automatically concatenates the link: `=CONCATENATE("[https://bookshop.org/a/12345/](https://bookshop.org/a/12345/)", B2)`
* **Why it works:** You can glance down your spreadsheet rows to make sure the covers and titles match before importing them into your website CMS (like WordPress, Webflow, or Notion). It gives you a visual "sanity check" step.

---

## Option 3: CMS Pre-fetch UI (Low-Code/No-Code)
If your website runs on something like WordPress, Ghost, or Notion, you can build the automation directly into your "New Post" screen.

* **The Workflow:** When you start a new review post, you type the book title into a single search box. The system runs a quick background search and displays the top 3 visual results (Cover image + Format + ISBN). You click the correct one. The CMS automatically saves the accurate ISBN to your post's custom fields and safely generates your `/a/{a_id}/{isbn}` link on the front-end template.
* **Why it works:** It avoids "invisible errors" because you see exactly what book data is being tied to your review before you hit publish. 

---

> ### 💡 A Rule of Thumb for Your Architecture
> To avoid errors without relying on deep APIs, **delegate the searching to your own eyes, but delegate the URL construction to code.** Finding the book manually ensures accuracy; letting a script format the string `"/a/" + id + "/" + isbn` ensures zero typos.

<FollowUp label="Would you like to write a custom Google Sheets script or web Bookmarklet tailored to your workflow?" query="Show me how to build a simple tool (like a Google Sheets script or custom HTML form) that turns a book title or URL into a validated Bookshop.org affiliate link."/>

---

# you asked

message time: 2026-07-18 17:08:48

One other data point I have if from Libby. The app allows me to export an html or json list of all of the books I've rented. My wife and I share a library card so both of our books are in there. How would you turn that into a workflow? Maybe I could parse the export and upsert the books into a database, then build an admin feature for writing reviews. Once a book has a review it automatically appears on the site with its affiliate link. Doable? This would probably be on WordPress

---

# gemini response

This is an exceptional way to tackle the problem. By leaning into Libby's data export, you eliminate the blank-page problem of manually typing titles, authors, and ISBNs into a database, while keeping full human control over which books actually get published with a review.

Since you are considering **WordPress**, you can actually build this without setting up a completely separate custom database or coding an admin panel from scratch. You can utilize WordPress's native architecture: **Custom Post Types** and **Custom Fields**.

---

## The Workflow Blueprint

```
[ Libby Export (JSON/CSV) ] 
       │
       ▼
[ WordPress Custom Import Script ]
       │
       ▼
[ Holds as "Draft" Reviews (Inbox) ] ───► [ Wife reads & skips? ➔ Trash ]
       │
       ▼ (You write review)
[ Hit "Publish" ] ───► [ Live Site with /a/{id}/{isbn} Affiliate Link ]
```

---

## 1. Setting Up the WordPress Foundation
Instead of hacking the standard WordPress "Posts" (which you might want to use for normal blog articles), you should separate your reviews.

* **Custom Post Type (CPT):** Create a post type called `book_review`.
* **Custom Fields (Meta):** Every book review will need a few hidden data slots attached to it:
  * `book_author`
  * `book_isbn` (The EAN-13 grabbed from the data)
  * `book_format` (Libby tracks whether it was an Ebook or Audiobook)
  * `libby_checkout_date`

> **The Easy Route:** Use the popular, free plugins **Advanced Custom Fields (ACF)** to add the metadata fields, and **Custom Post Type UI (CPT UI)** to register the "Book Reviews" section in your sidebar.

---

## 2. Handling the Shared Library Card (The "Inbox" Strategy)
Because your wife’s reading history is mixed into the export, your script should never publish anything automatically. Instead, **import everything from the file as a `Draft`**. 

Think of your WordPress Drafts folder as an **Inbox**. 
* If your wife read it and you don't want to review it, you simply delete the draft.
* If you want to review it, you open the draft, write your thoughts, and change the status to **Published**.

---

## 3. The Implementation: Programmatic Parsing
Libby allows you to export your "Timeline" as a CSV or JSON file. The data looks roughly like this, cleanly supplying the exact `isbn` you need:

```json
{
  "title": "The Hobbit",
  "author": "J.R.R. Tolkien",
  "isbn": "9780261102217",
  "format": "ebook",
  "activityDate": "2026-03-15"
}
```

You can write a simple custom PHP script that you drop into your WordPress theme folder (or run via a plugin like *Code Snippets*) to handle the file upload and "upsert" the data.

### The Upsert PHP Logic
An "upsert" means *Insert if it doesn't exist, otherwise skip/update*. We can use the unique **ISBN** as the key to ensure you don't accidentally duplicate a draft if you upload an overlapping history export next month.

```php
function import_libby_json_data($json_filepath) {
    $json_data = file_get_contents($json_filepath);
    $books = json_decode($json_data, true);

    foreach ($books as $book) {
        $isbn = sanitize_text_field($book['isbn']);
        
        // 1. Check if this ISBN already exists in your reviews to prevent duplicates
        $existing_books = get_posts([
            'post_type'  => 'book_review',
            'post_status'=> ['publish', 'draft', 'pending'],
            'meta_key'   => 'book_isbn',
            'meta_value' => $isbn,
            'posts_per_page' => 1
        ]);

        if (!empty($existing_books)) {
            continue; // Skip this book, it's already in our system!
        }

        // 2. It's a new book, create a Draft post
        $post_id = wp_insert_post([
            'post_title'   => sanitize_text_field($book['title']),
            'post_type'    => 'book_review',
            'post_status'  => 'draft', // Saved as draft for you to review later
            'post_content' => '', // Empty until you write the review
        ]);

        if ($post_id) {
            // 3. Save the custom metadata properties
            update_post_meta($post_id, 'book_author', sanitize_text_field($book['author']));
            update_post_meta($post_id, 'book_isbn', $isbn);
            update_post_meta($post_id, 'book_format', sanitize_text_field($book['format']));
        }
    }
}
```

---

## 4. Automatically Rendering the Affiliate Link
Once a review is ready and you hit **Publish**, you don't want to manually build the link. You can inject it directly into the bottom of the review template using a filter in your theme's `functions.php` file:

```php
add_filter('the_content', 'append_bookshop_affiliate_link');

function append_bookshop_affiliate_link($content) {
    // Only apply this logic on individual "Book Review" pages
    if (is_singular('book_review')) {
        global $post;
        
        $isbn = get_post_meta($post->ID, 'book_isbn', true);
        $affiliate_id = 'YOUR_ID_HERE'; // Replace with your real ID

        if (!empty($isbn)) {
            $affiliate_url = "https://bookshop.org/a/{$affiliate_id}/{$isbn}";
            
            $button_html = '<div class="bookshop-link-wrapper">';
            $button_html .= '<a href="' . esc_url($affiliate_url) . '" class="bookshop-btn" target="_blank" rel="noopener">';
            $button_html .= 'Buy this book on Bookshop.org';
            $button_html .= '</a></div>';
            
            return $content . $button_html;
        }
    }
    return $content;
}
```

## Why this is highly reliable
1. **Zero Data Misalignment:** The ISBNs are handed down directly from Libby's official catalogs, matching the exact version you checked out. 
2. **No Live API Latency:** Because the script only runs when you manually upload a JSON file, your website speed won't be affected by external server calls or hitting usage rate-limits.
3. **No Database Mess:** If things get cluttered, you can delete a post just like a standard WordPress blog post. Everything cleans up nicely.

---
Powered by [AI Exporter](https://saveai.net)