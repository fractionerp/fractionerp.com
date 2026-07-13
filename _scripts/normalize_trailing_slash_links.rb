#!/usr/bin/env ruby

require "rexml/document"
require "set"
require "uri"

root = File.expand_path("..", __dir__)
fix = ARGV.delete("--fix")
sitemap_path = ARGV.first || File.join(root, "_site", "sitemap.xml")

unless File.file?(sitemap_path)
  warn "Sitemap not found: #{sitemap_path}"
  exit 2
end

document = REXML::Document.new(File.read(sitemap_path))
canonical_paths = Set.new

REXML::XPath.each(document, "//loc") do |node|
  path = URI.parse(node.text).path
  canonical_paths << path if path.end_with?("/") && path != "/"
end

source_files = Dir.glob(File.join(root, "**", "*.{html,md,yml,txt}"))
source_files.reject! do |file|
  file.include?("/_site/") || file.include?("/vendor/") || file.include?("/_scripts/")
end

changed_files = 0
changed_links = 0

url_replacements = {}
path_replacements = {}

canonical_paths.each do |canonical_path|
  path_without_slash = canonical_path.chomp("/")
  absolute_url = "https://fractionerp.com#{path_without_slash}"

  path_replacements[path_without_slash] = canonical_path
  url_replacements[path_without_slash] = canonical_path
  url_replacements[absolute_url] = "#{absolute_url}/"
end

url_pattern = Regexp.union(url_replacements.keys.sort_by { |url| -url.length })
path_pattern = Regexp.union(path_replacements.keys.sort_by { |path| -path.length })

source_files.each do |file|
  original = File.binread(file)
  content = original.dup
  file_changes = 0

  content.gsub!(/(href\s*=\s*["'])(#{url_pattern})(?=[#?"'])/) do
    file_changes += 1
    "#{Regexp.last_match(1)}#{url_replacements.fetch(Regexp.last_match(2))}"
  end

  content.gsub!(/(\]\()(#{url_pattern})(?=[#?\s)])/) do
    file_changes += 1
    "#{Regexp.last_match(1)}#{url_replacements.fetch(Regexp.last_match(2))}"
  end

  content.gsub!(/(<)(#{url_pattern})(?=[#?>])/) do
    file_changes += 1
    "#{Regexp.last_match(1)}#{url_replacements.fetch(Regexp.last_match(2))}"
  end

  content.gsub!(/^(\s*url:\s*["']?)(#{path_pattern})(["']?\s*)$/) do
    file_changes += 1
    "#{Regexp.last_match(1)}#{path_replacements.fetch(Regexp.last_match(2))}#{Regexp.last_match(3)}"
  end

  content.gsub!(/(["'])(#{path_pattern})(["']\s*\|\s*(?:relative_url|absolute_url))/) do
    file_changes += 1
    "#{Regexp.last_match(1)}#{path_replacements.fetch(Regexp.last_match(2))}#{Regexp.last_match(3)}"
  end

  content.gsub!(/(\]\(\{\{\s*site\.baseurl\s*\}\})(#{path_pattern})(?=[#?\s)])/) do
    file_changes += 1
    "#{Regexp.last_match(1)}#{path_replacements.fetch(Regexp.last_match(2))}"
  end

  content.gsub!(/(href\s*=\s*["']\{\{\s*site\.baseurl\s*\}\})(#{path_pattern})(?=[#?"'])/) do
    file_changes += 1
    "#{Regexp.last_match(1)}#{path_replacements.fetch(Regexp.last_match(2))}"
  end

  next if file_changes.zero?

  changed_files += 1
  changed_links += file_changes

  if fix
    File.binwrite(file, content)
  else
    puts "#{file.delete_prefix("#{root}/")}: #{file_changes}"
  end
end

message = "#{changed_links} non-canonical internal links across #{changed_files} files"

if fix
  puts "Normalised #{message}"
else
  puts message
  exit 1 unless changed_links.zero?
end
